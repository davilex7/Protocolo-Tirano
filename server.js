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
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

let db, usersCollection, gamesCollection;

// --- Middleware de Autenticación y Admin ---
const authenticateToken = (req, res, next) => {
    // Permite que las peticiones de sondeo (preflight) OPTIONS pasen sin autenticación.
    if (req.method === 'OPTIONS') {
        return next();
    }
    
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
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Acción restringida a administradores.' });
    }
};

// --- Lógica de Finalización de Votos (Refactorizada y Robusta) ---
async function finalizeVotes(gameId) {
    const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
    if (!game || game.status !== 'voting') {
        console.log(`Saltando finalización para el juego ${gameId}, el estado no es 'voting'.`);
        return;
    }

    console.log(`[INICIO] Finalizando votación para el juego: "${game.name}" (${game._id})`);

    const allActivePlayers = await usersCollection.find({ isAdmin: false }).toArray();
    const allActiveUsernames = allActivePlayers.map(p => p.username);
    
    // Objeto para acumular todos los cambios de estadísticas
    const changes = {};
    allActiveUsernames.forEach(username => {
        changes[username] = { tokens: 0, prestige: 0 };
    });

    const finalVotes = { ...game.votes };

    // 1. Identificar a los jugadores que NO votaron y aplicarles la penalización por INACCIÓN.
    const votedUsernames = Object.keys(game.votes);
    const nonVotersUsernames = allActiveUsernames.filter(u => !votedUsernames.includes(u));
    
    nonVotersUsernames.forEach(username => {
        console.log(` -> Jugador '${username}' no votó. Penalización por inacción: -1 Prestigio.`);
        changes[username].prestige -= 1; // Penalización por inacción
        finalVotes[username] = 0; // Su voto se convierte en 0
    });

    // 2. Iterar sobre la lista de votos FINAL (incluyendo los de los no-votantes) y aplicar las consecuencias de cada VOTO.
    for (const username in finalVotes) {
        // Asegurarse de que el votante sigue siendo un jugador activo
        if (allActiveUsernames.includes(username)) {
            const vote = finalVotes[username];
            switch (vote) {
                case 3:
                    console.log(` -> Voto '3' de '${username}'. Consecuencia: -1 Token.`);
                    changes[username].tokens -= 1;
                    break;
                case 1:
                    console.log(` -> Voto '1' de '${username}'. Consecuencia: +0.5 Prestigio.`);
                    changes[username].prestige += 0.5;
                    break;
                case 0:
                    console.log(` -> Voto '0' de '${username}'. Consecuencia: +1 Token.`);
                    changes[username].tokens += 1;
                    break;
                // El voto '2' no tiene consecuencias directas.
            }
        }
    }

    // 3. Otorgar prestigio al nominador si recibió un '3' de otro jugador
    if (game.nominatedBy && allActiveUsernames.includes(game.nominatedBy)) {
        const hasExternalThree = Object.entries(finalVotes).some(
            ([user, vote]) => vote === 3 && user !== game.nominatedBy && allActiveUsernames.includes(user)
        );
        if (hasExternalThree) {
            console.log(` -> Juego nominado por '${game.nominatedBy}' recibió apoyo externo. Recompensa: +1 Prestigio.`);
            changes[game.nominatedBy].prestige += 1;
        }
    }

    // 4. Construir y aplicar los cambios a la base de datos
    const bulkUserOps = Object.entries(changes)
        .filter(([_, change]) => change.tokens !== 0 || change.prestige !== 0)
        .map(([username, change]) => ({
            updateOne: {
                filter: { username },
                update: { $inc: { tokens: change.tokens, prestige: change.prestige } }
            }
        }));

    if (bulkUserOps.length > 0) {
        console.log(" -> Aplicando cambios de estadísticas en la BD:", JSON.stringify(bulkUserOps, null, 2));
        await usersCollection.bulkWrite(bulkUserOps);
    } else {
        console.log(" -> No hay cambios en las estadísticas de los jugadores para aplicar.");
    }

    // 5. Finalizar el estado del juego
    console.log(` -> Actualizando estado del juego a 'active' con los votos finales:`, JSON.stringify(finalVotes));
    await gamesCollection.updateOne(
        { _id: new ObjectId(game._id) },
        { $set: { votes: finalVotes, status: 'active' }, $unset: { revealAt: "" } }
    );
    console.log(`[FIN] Votación para "${game.name}" procesada y finalizada.`);
}

// --- Función Principal ---
async function main() {
    try {
        await client.connect();
        console.log("Conectado a MongoDB Atlas");
        db = client.db("protocolo_tirano_db");
        usersCollection = db.collection('users');
        gamesCollection = db.collection('games');

        // --- Inicialización de la Base de Datos ---
        const initialUsers = [
            { username: 'admin', password: 'adminpassword', name: 'Admin', isAdmin: true },
            { username: 'david', password: 'david123', name: 'David', isAdmin: false },
            { username: 'pablo', password: 'pablo123', name: 'Pablo', isAdmin: false },
            { username: 'sergio', password: 'sergio123', name: 'Sergio', isAdmin: false },
            { username: 'miguel', password: 'miguel123', name: 'Miguel', isAdmin: false },
        ];
        for (const userData of initialUsers) {
            if (!(await usersCollection.findOne({ username: userData.username }))) {
                console.log(`Creando usuario: ${userData.username}`);
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                await usersCollection.insertOne({
                    username: userData.username, password: hashedPassword, name: userData.name,
                    isAdmin: userData.isAdmin, tokens: 3, vetoes: 1, prestige: 0,
                    nominationCooldownUntil: null,
                });
            }
        }
        console.log("Verificación de usuarios completada.");

        // --- Router de la API ---
        const apiRouter = express.Router();
        
        apiRouter.post('/login', async (req, res) => {
            const { username, password } = req.body;
            const user = await usersCollection.findOne({ username });
            if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ message: 'Credenciales incorrectas' });
            const accessToken = jwt.sign({ username: user.username, name: user.name, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({ accessToken });
        });
        
        apiRouter.use(authenticateToken);

        // --- RUTAS AUTENTICADAS ---
        apiRouter.get('/state', async (req, res) => {
            try {
                const expiredGames = await gamesCollection.find({ status: 'voting', revealAt: { $lte: new Date() } }).toArray();
                for (const game of expiredGames) {
                    await finalizeVotes(game._id);
                }
                const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
                const games = await gamesCollection.find({}).toArray();
                res.json({ users, games, currentUser: req.user });
            } catch (error) {
                console.error("Error en /api/state:", error);
                res.status(500).json({ message: "Error interno del servidor al obtener el estado."});
            }
        });

        apiRouter.post('/user/change-password', async (req, res) => {
            const { currentPassword, newPassword } = req.body;
            if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
            const user = await usersCollection.findOne({ username: req.user.username });
            if (!user || !await bcrypt.compare(currentPassword, user.password)) return res.status(403).json({ message: 'La contraseña actual es incorrecta.' });
            await usersCollection.updateOne({ username: req.user.username }, { $set: { password: await bcrypt.hash(newPassword, 10) } });
            res.status(200).json({ message: 'Contraseña actualizada.' });
        });
        
        apiRouter.post('/games', async (req, res) => {
            if (req.user.isAdmin) return res.status(403).json({ message: 'El admin no puede nominar.' });
            const user = await usersCollection.findOne({ username: req.user.username });
            if (user.nominationCooldownUntil && new Date(user.nominationCooldownUntil) > new Date()) return res.status(403).json({ message: `Cooldown activo.` });
            if (await gamesCollection.findOne({ nominatedBy: req.user.username, status: 'voting' })) return res.status(403).json({ message: 'Ya tienes una nominación en curso.' });
            
            await gamesCollection.insertOne({ 
                name: req.body.name, status: 'voting', votes: {}, totalScore: 0, 
                nominatedBy: req.user.username, revealAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
            res.status(201).json({ message: 'Juego nominado. La votación ha comenzado.' });
        });

        apiRouter.delete('/games/:id', async (req, res) => {
            const game = await gamesCollection.findOne({ _id: new ObjectId(req.params.id), nominatedBy: req.user.username, status: 'voting' });
            if (!game) return res.status(403).json({ message: 'Acción no permitida.' });
            
            await gamesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
            await usersCollection.updateOne({ username: req.user.username }, { $set: { nominationCooldownUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
            res.status(200).json({ message: 'Nominación cancelada. Cooldown de 24h aplicado.' });
        });

        apiRouter.post('/games/:id/vote', async (req, res) => {
            if (req.user.isAdmin) return res.status(403).json({ message: 'El admin no puede votar.' });
            const { vote } = req.body;
            const game = await gamesCollection.findOne({ _id: new ObjectId(req.params.id) });
            if (!game || game.status !== 'voting') return res.status(400).json({ message: 'La votación para este juego ha terminado.' });

            const oldVote = game.votes[req.user.username];
            if (oldVote !== undefined && oldVote !== vote) {
                // Penalización por modificar voto
                await usersCollection.updateOne({ username: req.user.username }, { $inc: { prestige: -1 }});
            }
            
            await gamesCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { [`votes.${req.user.username}`]: vote } });
            res.status(200).json({ message: 'Voto registrado.' });
        });
        
        apiRouter.post('/games/:id/veto', async (req, res) => {
            const vetoer = await usersCollection.findOne({ username: req.user.username });
            if (vetoer.vetoes < 1) return res.status(403).json({ message: 'No tienes vetos restantes.' });
            
            const game = await gamesCollection.findOne({ _id: new ObjectId(req.params.id) });
            if (!game || game.status !== 'active') return res.status(403).json({ message: 'Solo se pueden vetar juegos activos.' });
            if (game.votes[req.user.username] !== 0) return res.status(403).json({ message: 'Debes haber votado 0 para poder vetar.' });

            await usersCollection.updateOne({ username: req.user.username }, { $inc: { vetoes: -1 } });
            if (game.nominatedBy) await usersCollection.updateOne({ username: game.nominatedBy }, { $inc: { prestige: -3 } });
            await gamesCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: 'vetoed', vetoedBy: req.user.username }, $unset: { revealAt: "" } });
            
            res.status(200).json({ message: 'Juego vetado con éxito.' });
        });
        
        // --- RUTAS DE ADMINISTRADOR ---
        apiRouter.post('/admin/games/:id/reveal', isAdmin, async (req, res) => {
            try {
                await finalizeVotes(req.params.id);
                res.status(200).json({ message: 'Votación finalizada por el admin.' });
            } catch (error) {
                console.error("Error al finalizar votación (admin):", error);
                res.status(500).json({ message: "Error interno del servidor al finalizar la votación."});
            }
        });
        
        apiRouter.post('/admin/reset-password', isAdmin, async (req, res) => {
            const { username, newPassword } = req.body;
            if (!username || !newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Datos incompletos.' });
            await usersCollection.updateOne({ username }, { $set: { password: await bcrypt.hash(newPassword, 10) } });
            res.status(200).json({ message: `Contraseña de ${username} actualizada.` });
        });

        apiRouter.delete('/admin/games/:id', isAdmin, async (req, res) => {
            await gamesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
            res.status(200).json({ message: 'Juego eliminado permanentemente.' });
        });

        apiRouter.post('/admin/update-stats', isAdmin, async (req, res) => {
            const { username, tokens, vetoes, prestige } = req.body;
            await usersCollection.updateOne({ username }, { $set: { tokens: parseInt(tokens), vetoes: parseInt(vetoes), prestige: parseFloat(prestige) }});
            res.status(200).json({ message: `Estadísticas de ${username} actualizadas.` });
        });

        apiRouter.post('/admin/reset-all', isAdmin, async (req, res) => {
            await gamesCollection.deleteMany({});
            await usersCollection.updateMany({ username: { $ne: 'admin' } }, { $set: { tokens: 3, vetoes: 1, prestige: 0, nominationCooldownUntil: null, }});
            res.status(200).json({ message: 'Aplicación reseteada a valores por defecto.' });
        });
        
        apiRouter.post('/admin/games/:id/unveto', isAdmin, async (req, res) => {
            const game = await gamesCollection.findOne({ _id: new ObjectId(req.params.id) });
            if (!game || game.status !== 'vetoed') return res.status(400).json({ message: 'Este juego no está vetado.' });
            
            await usersCollection.updateOne({ username: game.vetoedBy }, { $inc: { vetoes: 1 } });
            if (game.nominatedBy) await usersCollection.updateOne({ username: game.nominatedBy }, { $inc: { prestige: 3 } });
            await gamesCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: 'active' }, $unset: { vetoedBy: "" } });
            
            res.status(200).json({ message: `Veto levantado. ${game.vetoedBy} ha recuperado su Veto.` });
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
