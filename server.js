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

// --- Middlewares Globales ---

// **INICIO DE LA CORRECCIÓN CORS DEFINITIVA**
// 1. Configuración de CORS explícita
const corsOptions = {
  origin: '*', // O para mayor seguridad: 'https://davilex7.github.io'
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 2. Manejador explícito para las peticiones OPTIONS (Preflight)
// Esto asegura que cualquier petición OPTIONS reciba la respuesta correcta inmediatamente.
app.options('*', cors(corsOptions)); 
// **FIN DE LA CORRECCIÓN CORS DEFINITIVA**

app.use(express.json());

let db, usersCollection, gamesCollection;

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
        console.log("Verificando usuarios iniciales...");
        const initialUsers = [
            { username: 'admin', password: 'adminpassword', name: 'Admin', isAdmin: true },
            { username: 'david', password: 'david123', name: 'David', isAdmin: false },
            { username: 'pablo', password: 'pablo123', name: 'Pablo', isAdmin: false },
            { username: 'sergio', password: 'sergio123', name: 'Sergio', isAdmin: false },
            { username: 'miguel', password: 'miguel123', name: 'Miguel', isAdmin: false },
        ];

        for (const userData of initialUsers) {
            const existingUser = await usersCollection.findOne({ username: userData.username });
            if (!existingUser) {
                console.log(`Usuario "${userData.username}" no encontrado. Creándolo...`);
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                const newUser = {
                    username: userData.username, password: hashedPassword, name: userData.name,
                    isAdmin: userData.isAdmin, tokens: 3, vetoes: 1, prestige: 0,
                    nominationCooldownUntil: null,
                };
                await usersCollection.insertOne(newUser);
                console.log(`Usuario "${userData.username}" creado con éxito.`);
            }
        }
        console.log("Verificación de usuarios completada.");


        // --- Router de la API ---
        const apiRouter = express.Router();
        
        // El resto del código del servidor (rutas, etc.) es idéntico al anterior.
        // POST /api/login
        apiRouter.post('/login', async (req, res) => {
            const { username, password } = req.body;
            const user = await usersCollection.findOne({ username });
            if (!user || !await bcrypt.compare(password, user.password)) {
                return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
            }
            const accessToken = jwt.sign({ username: user.username, name: user.name, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({ accessToken });
        });

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
            const gameId = req.params.id;
            const { vote } = req.body;
            const voterUsername = req.user.username;

            const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
            const voter = await usersCollection.findOne({ username: voterUsername });
            
            if (voterUsername === game.nominatedBy && Object.keys(game.votes).length === 0) {
                return res.status(403).json({ message: 'No puedes ser el primero en votar tu propia nominación.' });
            }

            const oldVote = game.votes[voterUsername];
            let tokenChange = 0;
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
            if (tokenChange !== 0) {
                await usersCollection.updateOne({ username: voterUsername }, { $inc: { tokens: tokenChange } });
            }

            if (vote === 3 && game.nominatedBy && game.nominatedBy !== voterUsername) {
                await usersCollection.updateOne({ username: game.nominatedBy }, { $inc: { prestige: 1 } });
            }
            if (oldVote === 3 && vote !== 3 && game.nominatedBy && game.nominatedBy !== voterUsername) {
                await usersCollection.updateOne({ username: game.nominatedBy }, { $inc: { prestige: -1 } });
            }

            res.status(200).json({ message: 'Voto registrado.' });
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
        
        // --- RUTAS DE ADMINISTRADOR ---
        apiRouter.use(isAdmin);

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
            await usersCollection.updateMany({ isAdmin: false }, { $set: {
                tokens: 3,
                vetoes: 1,
                prestige: 0,
                nominationCooldownUntil: null,
            }});
            res.status(200).json({ message: 'Aplicación reseteada a valores por defecto (excepto contraseñas).' });
        });
        
        // --- CONFIGURACIÓN DE RUTAS PRINCIPAL ---
        app.use('/api', apiRouter);
        app.use(express.static(path.join(__dirname, 'docs')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'docs', 'index.html'));
        });

        app.listen(port, () => console.log(`Servidor escuchando en http://localhost:${port}`));
    } catch (e) { console.error("Fallo al iniciar el servidor:", e); }
}

main().catch(console.error);
