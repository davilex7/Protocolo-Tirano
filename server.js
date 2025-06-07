const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path'); // Importante: Módulo 'path' de Node.js
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGODB_URI);

app.use(cors());
app.use(express.json());

let db;
let usersCollection;
let gamesCollection;

// --- Middleware de Autenticación ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

async function main() {
    try {
        await client.connect();
        console.log("Conectado a MongoDB Atlas");
        db = client.db("protocolo_tirano_db");
        usersCollection = db.collection('users');
        gamesCollection = db.collection('games');

        // --- Inicialización de la Base de Datos (sin cambios) ---
        const count = await usersCollection.countDocuments();
        if (count === 0) {
            console.log("Base de datos de usuarios vacía. Creando usuarios iniciales...");
            const users = [
                { username: 'david', password: 'david123', name: 'David' },
                { username: 'pablo', password: 'pablo123', name: 'Pablo' },
                { username: 'sergio', password: 'sergio123', name: 'Sergio' },
                { username: 'miguel', password: 'miguel123', name: 'Miguel' },
            ];
            
            const hashedUsers = await Promise.all(users.map(async user => {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                return {
                    username: user.username,
                    password: hashedPassword,
                    name: user.name,
                    tokens: 3,
                    vetoes: 1,
                    prestige: 0,
                    nominationCooldownUntil: null,
                };
            }));
            await usersCollection.insertMany(hashedUsers);
            console.log("Usuarios creados con éxito.");
        }

        // --- DEFINICIÓN DEL ROUTER DE LA API ---
        const apiRouter = express.Router();
        
        // Rutas que no requieren autenticación
        apiRouter.post('/login', async (req, res) => {
            const { username, password } = req.body;
            const user = await usersCollection.findOne({ username });
            if (!user) return res.status(400).send({ message: 'Usuario o contraseña incorrectos' });
            if (await bcrypt.compare(password, user.password)) {
                const accessToken = jwt.sign({ username: user.username, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
                res.json({ accessToken });
            } else {
                res.status(400).send({ message: 'Usuario o contraseña incorrectos' });
            }
        });

        // A partir de aquí, todas las rutas del router usan el middleware
        apiRouter.use(authenticateToken);

        apiRouter.get('/state', async (req, res) => {
            try {
                const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
                const games = await gamesCollection.find({}).toArray();
                res.json({ users, games, currentUser: req.user });
            } catch (error) { res.status(500).json({ message: "Error al obtener el estado" }); }
        });
        
        apiRouter.post('/user/change-password', async (req, res) => {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
            
            const user = await usersCollection.findOne({ username: req.user.username });
            if (!user || !await bcrypt.compare(currentPassword, user.password)) return res.status(403).json({ message: 'La contraseña actual es incorrecta.' });

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await usersCollection.updateOne({ username: req.user.username }, { $set: { password: hashedNewPassword } });
            res.status(200).json({ message: 'Contraseña actualizada con éxito.' });
        });

        apiRouter.post('/games', async (req, res) => {
            const user = await usersCollection.findOne({ username: req.user.username });
            if (user.nominationCooldownUntil && new Date(user.nominationCooldownUntil) > new Date()) return res.status(403).json({ message: `No puedes nominar hasta ${new Date(user.nominationCooldownUntil).toLocaleString()}` });
            const pendingNomination = await gamesCollection.findOne({ nominatedBy: req.user.username, status: 'pending_vote' });
            if (pendingNomination) return res.status(403).json({ message: 'Ya tienes una nominación pendiente de voto.' });
            
            const newGame = { name: req.body.name, status: 'pending_vote', votes: {}, totalScore: 0, nominatedBy: req.user.username };
            await gamesCollection.insertOne(newGame);
            res.status(201).json(newGame);
        });

        apiRouter.delete('/games/:id', async (req, res) => {
            const game = await gamesCollection.findOne({ _id: new ObjectId(req.params.id) });
            if (!game || game.nominatedBy !== req.user.username) return res.status(403).json({ message: 'Acción no permitida.' });
            if (game.status !== 'pending_vote') return res.status(400).json({ message: 'Solo se pueden cancelar nominaciones pendientes.' });

            await gamesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
            const cooldownUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await usersCollection.updateOne({ username: req.user.username }, { $set: { nominationCooldownUntil: cooldownUntil } });
            res.status(200).json({ message: 'Nominación cancelada. Cooldown de 24h aplicado.' });
        });

        apiRouter.post('/games/:id/vote', async (req, res) => {
            const { votes } = req.body;
            const users = await usersCollection.find({ username: { $in: Object.keys(votes) } }).toArray();
            const userMap = new Map(users.map(u => [u.username, u]));
            
            for (const username in votes) {
                if (votes[username] === 3 && userMap.get(username).tokens < 1) return res.status(400).json({ message: `El jugador ${username} no tiene Tokens de Prioridad.` });
            }
            
            const bulkOps = Object.keys(votes).map(username => {
                let tokenChange = { 3: -1, 0: 1 }[votes[username]] || 0;
                return { updateOne: { filter: { username }, update: { $inc: { tokens: tokenChange } } } };
            }).filter(op => op.updateOne.update.$inc.tokens !== 0);

            if (bulkOps.length > 0) await usersCollection.bulkWrite(bulkOps);
            await gamesCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { votes, status: 'active' } });
            res.status(200).json({ message: 'Votos registrados.' });
        });

        apiRouter.post('/games/:id/veto', async (req, res) => {
            const vetoer = await usersCollection.findOne({ username: req.user.username });
            if (vetoer.vetoes < 1) return res.status(403).json({ message: 'No tienes vetos restantes.' });

            const game = await gamesCollection.findOne({ _id: new ObjectId(req.params.id) });
            if (!game || game.votes[req.user.username] !== 0) return res.status(403).json({ message: 'Debes haber votado 0 para poder vetar.' });

            await usersCollection.updateOne({ username: req.user.username }, { $inc: { vetoes: -1 } });
            if (game.nominatedBy) await usersCollection.updateOne({ username: game.nominatedBy }, { $inc: { prestige: -5 } });
            await gamesCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: 'vetoed', vetoedBy: req.user.username } });
            
            res.status(200).json({ message: 'Juego vetado con éxito.' });
        });
        
        // --- CONFIGURACIÓN DE RUTAS PRINCIPAL ---
        
        // 1. Usar el router para todas las rutas que empiecen con /api
        app.use('/api', apiRouter);

        // 2. Servir los ficheros estáticos de la aplicación frontend
        app.use(express.static(path.join(__dirname, 'docs')));

        // 3. Ruta "catch-all" que devuelve el index.html para cualquier otra petición.
        //    Esto es clave para que funcionen las Single Page Applications.
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'docs', 'index.html'));
        });

        // Iniciar servidor
        app.listen(port, () => {
            console.log(`Servidor escuchando en http://localhost:${port}`);
        });

    } catch (e) { console.error(e); }
}

main().catch(console.error);
