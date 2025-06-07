const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGODB_URI);

app.use(cors());
app.use(express.json());
app.use(express.static('docs'));

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

        // --- Inicialización de la Base de Datos ---
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
                    tokens: 3, // Capital inicial de Tokens de Prioridad
                    vetoes: 1, // Veto único
                    prestige: 0, // Prestigio inicial
                    nominationCooldownUntil: null, // Sin cooldown inicial
                };
            }));
            await usersCollection.insertMany(hashedUsers);
            console.log("Usuarios creados con éxito.");
        }

        // --- RUTAS DE LA API ---

        // POST /api/login: Iniciar sesión
        app.post('/api/login', async (req, res) => {
            const { username, password } = req.body;
            const user = await usersCollection.findOne({ username });
            if (!user) return res.status(400).send('Usuario o contraseña incorrectos');
            if (await bcrypt.compare(password, user.password)) {
                const accessToken = jwt.sign({ username: user.username, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
                res.json({ accessToken });
            } else {
                res.status(400).send('Usuario o contraseña incorrectos');
            }
        });
        
        // --- RUTAS PROTEGIDAS ---

        app.get('/api/state', authenticateToken, async (req, res) => {
            try {
                const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
                const games = await db.collection('games').find({}).toArray();
                res.json({ users, games, currentUser: req.user });
            } catch (error) { res.status(500).json({ message: "Error al obtener el estado" }); }
        });

        app.post('/api/games', authenticateToken, async (req, res) => {
            const { name } = req.body;
            const nominatorUsername = req.user.username;

            const user = await usersCollection.findOne({ username: nominatorUsername });
            if (user.nominationCooldownUntil && new Date(user.nominationCooldownUntil) > new Date()) {
                return res.status(403).json({ message: `No puedes nominar hasta ${new Date(user.nominationCooldownUntil).toLocaleString()}` });
            }
            const pendingNomination = await gamesCollection.findOne({ nominatedBy: nominatorUsername, status: 'pending_vote' });
            if (pendingNomination) {
                return res.status(403).json({ message: 'Ya tienes una nominación pendiente de voto.' });
            }
            const newGame = { name, status: 'pending_vote', votes: {}, totalScore: 0, nominatedBy: nominatorUsername };
            const result = await gamesCollection.insertOne(newGame);
            res.status(201).json(result);
        });

        app.delete('/api/games/:id', authenticateToken, async (req, res) => {
            const gameId = req.params.id;
            const username = req.user.username;
            const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
            if (game.nominatedBy !== username) return res.status(403).json({ message: 'No puedes cancelar una nominación que no es tuya.' });
            if (game.status !== 'pending_vote') return res.status(400).json({ message: 'Solo se pueden cancelar nominaciones pendientes.' });

            await gamesCollection.deleteOne({ _id: new ObjectId(gameId) });
            const cooldownUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
            await usersCollection.updateOne({ username }, { $set: { nominationCooldownUntil: cooldownUntil } });
            res.status(200).json({ message: 'Nominación cancelada. Cooldown de 24h aplicado.' });
        });

        app.post('/api/games/:id/vote', authenticateToken, async (req, res) => {
            const gameId = req.params.id;
            const votes = req.body.votes; // { david: 3, pablo: 2, etc. }
            
            const voters = Object.keys(votes);
            const users = await usersCollection.find({ username: { $in: voters } }).toArray();
            const userMap = new Map(users.map(u => [u.username, u]));
            
            // Validar si los jugadores tienen suficientes tokens para sus votos
            for (const username of voters) {
                const vote = votes[username];
                if (vote === 3) {
                    if (userMap.get(username).tokens < 1) {
                        return res.status(400).json({ message: `El jugador ${username} no tiene suficientes Tokens de Prioridad para votar '3'.` });
                    }
                }
            }
            
            // Aplicar cambios
            const bulkOps = [];
            for (const username of voters) {
                const vote = votes[username];
                let tokenChange = 0;
                if (vote === 3) tokenChange = -1;
                if (vote === 0) tokenChange = 1;
                
                if (tokenChange !== 0) {
                    bulkOps.push({
                        updateOne: {
                            filter: { username: username },
                            update: { $inc: { tokens: tokenChange } }
                        }
                    });
                }
            }
            if (bulkOps.length > 0) {
                await usersCollection.bulkWrite(bulkOps);
            }

            await gamesCollection.updateOne({ _id: new ObjectId(gameId) }, { $set: { votes, status: 'active' } });
            res.status(200).json({ message: 'Votos registrados.' });
        });

        app.post('/api/games/:id/veto', authenticateToken, async (req, res) => {
            const gameId = req.params.id;
            const vetoerUsername = req.user.username;

            const vetoer = await usersCollection.findOne({ username: vetoerUsername });
            if (vetoer.vetoes < 1) return res.status(403).json({ message: 'No tienes vetos restantes.' });

            const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
            if (!game || game.votes[vetoerUsername] !== 0) {
                return res.status(403).json({ message: 'Debes haber votado 0 a este juego para poder vetarlo.' });
            }

            // Aplicar Veto y penalización
            await usersCollection.updateOne({ username: vetoerUsername }, { $inc: { vetoes: -1 } });
            await usersCollection.updateOne({ username: game.nominatedBy }, { $inc: { prestige: -5 } });
            await gamesCollection.updateOne({ _id: new ObjectId(gameId) }, { $set: { status: 'vetoed', vetoedBy: vetoerUsername } });
            
            res.status(200).json({ message: 'Juego vetado con éxito.' });
        });


        app.listen(port, () => {
            console.log(`Servidor escuchando en http://localhost:${port}`);
        });

    } catch (e) { console.error(e); }
}

main().catch(console.error);