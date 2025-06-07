const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGODB_URI);

app.use(cors());
app.use(express.json());

let db, usersCollection, gamesCollection;

// --- Middlewares ---
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

const isAdmin = async (req, res, next) => {
    const user = await usersCollection.findOne({ username: req.user.username });
    if (user && user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Acción restringida a administradores.' });
    }
};

// --- Función Principal ---
async function main() {
    try {
        await client.connect();
        console.log("Conectado a MongoDB Atlas");
        db = client.db("protocolo_tirano_db");
        usersCollection = db.collection('users');
        gamesCollection = db.collection('games');

        // --- Inicialización de la Base de Datos ---
        const count = await usersCollection.countDocuments();
        if (count === 0) {
            console.log("Base de datos de usuarios vacía. Creando usuarios iniciales...");
            const users = [
                { username: 'admin', password: 'adminpassword', name: 'Admin', isAdmin: true },
                { username: 'david', password: 'david123', name: 'David', isAdmin: false },
                { username: 'pablo', password: 'pablo123', name: 'Pablo', isAdmin: false },
                { username: 'sergio', password: 'sergio123', name: 'Sergio', isAdmin: false },
                { username: 'miguel', password: 'miguel123', name: 'Miguel', isAdmin: false },
            ];
            const hashedUsers = await Promise.all(users.map(async u => ({
                username: u.username, password: await bcrypt.hash(u.password, 10), name: u.name,
                isAdmin: u.isAdmin, tokens: 3, vetoes: 1, prestige: 0,
                nominationCooldownUntil: null,
            })));
            await usersCollection.insertMany(hashedUsers);
            console.log("Usuarios creados. Comunicar contraseñas de forma privada.");
        }

        // --- Router de la API ---
        const apiRouter = express.Router();
        
        // Rutas Públicas
        apiRouter.post('/login', async (req, res) => {
            const { username, password } = req.body;
            const user = await usersCollection.findOne({ username });
            if (!user || !await bcrypt.compare(password, user.password)) {
                return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
            }
            const accessToken = jwt.sign({ username: user.username, name: user.name, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({ accessToken });
        });

        // Middleware de Autenticación para el resto de rutas
        apiRouter.use(authenticateToken);

        // Rutas de Usuario
        apiRouter.get('/state', async (req, res) => {
            const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
            const games = await gamesCollection.find({}).toArray();
            res.json({ users, games, currentUser: req.user });
        });

        apiRouter.post('/user/change-password', async (req, res) => { /* ... (sin cambios) ... */ });

        // Rutas de Juegos
        apiRouter.post('/games', async (req, res) => { /* ... (sin cambios) ... */ });
        apiRouter.delete('/games/:id', async (req, res) => { /* ... (sin cambios) ... */ });
        
        // Lógica de voto individual actualizada
        apiRouter.post('/games/:id/vote', async (req, res) => {
            const gameId = req.params.id;
            const { vote } = req.body;
            const voterUsername = req.user.username;

            const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
            const voter = await usersCollection.findOne({ username: voterUsername });
            
            if (voterUsername === game.nominatedBy && game.status === 'pending_vote') {
                return res.status(403).json({ message: 'No puedes ser el primero en votar tu propia nominación.' });
            }

            const oldVote = game.votes[voterUsername];
            let tokenChange = 0;
            // Calcular cambio de tokens al modificar un voto
            if (oldVote !== undefined) {
                if (oldVote === 3) tokenChange += 1;
                if (oldVote === 0) tokenChange -= 1;
            }
            if (vote === 3) tokenChange -= 1;
            if (vote === 0) tokenChange += 1;
            
            if (voter.tokens + tokenChange < 0) {
                return res.status(400).json({ message: `No tienes suficientes Tokens de Prioridad.` });
            }

            const updateOps = { $set: { [`votes.${voterUsername}`]: vote } };
            if (game.status === 'pending_vote') {
                updateOps.$set.status = 'active';
            }

            await gamesCollection.updateOne({ _id: new ObjectId(gameId) }, updateOps);
            await usersCollection.updateOne({ username: voterUsername }, { $inc: { tokens: tokenChange } });

            // Otorgar prestigio
            if (vote === 3 && game.nominatedBy && game.nominatedBy !== voterUsername) {
                await usersCollection.updateOne({ username: game.nominatedBy }, { $inc: { prestige: 1 } });
            }
            // Retirar prestigio si se quita un 3
            if (oldVote === 3 && vote !== 3 && game.nominatedBy && game.nominatedBy !== voterUsername) {
                await usersCollection.updateOne({ username: game.nominatedBy }, { $inc: { prestige: -1 } });
            }

            res.status(200).json({ message: 'Voto registrado.' });
        });
        
        apiRouter.post('/games/:id/veto', async (req, res) => { /* ... (sin cambios) ... */ });
        
        // --- RUTAS DE ADMINISTRADOR ---
        apiRouter.use(isAdmin); // Middleware para las siguientes rutas

        apiRouter.post('/admin/reset-password', async (req, res) => {
            const { username, newPassword } = req.body;
            if (!username || !newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Datos incompletos.' });
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await usersCollection.updateOne({ username }, { $set: { password: hashedPassword } });
            res.status(200).json({ message: `Contraseña de ${username} actualizada.` });
        });

        apiRouter.delete('/admin/games/:id', async (req, res) => {
            await gamesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
            res.status(200).json({ message: 'Juego eliminado permanentemente.' });
        });

        apiRouter.post('/admin/update-stats', async (req, res) => {
            const { username, tokens, vetoes, prestige } = req.body;
            await usersCollection.updateOne({ username }, { $set: { 
                tokens: parseInt(tokens), 
                vetoes: parseInt(vetoes), 
                prestige: parseInt(prestige) 
            }});
            res.status(200).json({ message: `Estadísticas de ${username} actualizadas.` });
        });

        apiRouter.post('/admin/reset-all', async (req, res) => {
            await gamesCollection.deleteMany({});
            await usersCollection.updateMany({}, { $set: {
                tokens: 3,
                vetoes: 1,
                prestige: 0,
                nominationCooldownUntil: null,
            }});
            res.status(200).json({ message: 'Aplicación reseteada a valores por defecto (excepto contraseñas).' });
        });
        
        // Configuración de rutas principal
        app.use('/api', apiRouter);
        app.use(express.static(path.join(__dirname, 'docs')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'docs', 'index.html'));
        });

        app.listen(port, () => console.log(`Servidor escuchando en http://localhost:${port}`));
    } catch (e) { console.error("Fallo al iniciar el servidor:", e); }
}

main().catch(console.error);
