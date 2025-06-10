const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt =require('jsonwebtoken');
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
    if (req.method === 'OPTIONS') return next();
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

// --- Lógica de Recálculo y Finalización ---

async function updateGameScore(gameId) {
    const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
    if (!game) return;
    const totalScore = Object.values(game.votes).reduce((sum, vote) => sum + vote, 0);
    await gamesCollection.updateOne({ _id: new ObjectId(gameId) }, { $set: { totalScore: totalScore } });
}

async function recalculateAllScores() {
    console.log('[RECALC] Iniciando recálculo con la fórmula del "Bonus del Convicto".');
    const allActivePlayers = await usersCollection.find({ username: { $ne: 'admin' } }).toArray();
    const allActiveGames = await gamesCollection.find({ status: 'active' }).toArray();
    
    const bulkUserOps = allActivePlayers.map(player => {
        let totalVersatilityScore = 0;
        const prestigeBonusBase = (player.prestige || 0) / 10.0;

        allActiveGames.forEach(game => {
            if (game.votes.hasOwnProperty(player.username)) {
                const voteValue = game.votes[player.username];
                
                // Nueva Fórmula Definitiva: El "Bonus del Convicto"
                let specializationFactor = 0;
                if (voteValue === 3) specializationFactor = 4; // Factor 4 para el voto 3
                if (voteValue === 1) specializationFactor = 1; // Factor 1 para el voto 1
                
                const scoreForGame = voteValue + (prestigeBonusBase * specializationFactor);
                totalVersatilityScore += scoreForGame;
            }
        });
        
        return {
            updateOne: {
                filter: { _id: player._id },
                update: { $set: { totalVersatilityScore: parseFloat(totalVersatilityScore.toFixed(2)) } }
            }
        };
    });

    if (bulkUserOps.length > 0) {
        await usersCollection.bulkWrite(bulkUserOps);
    }
}

async function finalizeVotes(gameId) {
    const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
    if (!game || game.status !== 'voting') return;

    console.log(`[FINALIZE] Finalizando votación para: "${game.name}"`);

    const playerUpdates = {};
    const playersWithFragmentChanges = new Set();

    Object.keys(game.votes).forEach(username => {
        playerUpdates[username] = { prestige: 0, tokens: 0, committedTokens: 0, tokenFragments: 0 };
    });
    
    if (game.changeLog) {
        for (const username in game.changeLog) {
            if (playerUpdates[username]) playerUpdates[username].prestige -= game.changeLog[username];
        }
    }

    for (const username in game.votes) {
        const vote = game.votes[username];
        if (playerUpdates[username]) {
            if (vote === 0) { playerUpdates[username].tokens += 1; playerUpdates[username].prestige -= 0.5; }
            if (vote === 1) { playerUpdates[username].prestige += 0.5; }
            if (vote === 2) { playerUpdates[username].prestige += 0.1; playerUpdates[username].tokenFragments += 1; playersWithFragmentChanges.add(username); }
            if (vote === 3) { playerUpdates[username].tokens -= 1; playerUpdates[username].committedTokens -= 1; }
        }
    }

    const bulkUserOps = Object.entries(playerUpdates)
        .filter(([_, changes]) => Object.values(changes).some(v => v !== 0))
        .map(([username, changes]) => ({
            updateOne: { filter: { username: username }, update: { $inc: { ...changes } } }
        }));

    if (bulkUserOps.length > 0) {
        await usersCollection.bulkWrite(bulkUserOps);
    }
    
    if (playersWithFragmentChanges.size > 0) {
        const usersToCheck = await usersCollection.find({ username: { $in: [...playersWithFragmentChanges] } }).toArray();
        const conversionOps = [];
        usersToCheck.forEach(user => {
            if (user.tokenFragments >= 3) {
                const newTokens = Math.floor(user.tokenFragments / 3);
                const remainingFragments = user.tokenFragments % 3;
                conversionOps.push({
                    updateOne: {
                        filter: { username: user.username },
                        update: { $inc: { tokens: newTokens }, $set: { tokenFragments: remainingFragments } }
                    }
                });
            }
        });
        if (conversionOps.length > 0) await usersCollection.bulkWrite(conversionOps);
    }

    await gamesCollection.updateOne({ _id: new ObjectId(gameId) }, { $set: { status: 'active' }, $unset: { changeLog: "" } });
    await updateGameScore(gameId);
    await recalculateAllScores();
    console.log(`[FINALIZE] Votación para "${game.name}" finalizada. Recálculo completado.`);
}

// --- Función Principal ---
async function main() {
    try {
        await client.connect();
        console.log("Conectado a MongoDB Atlas");
        db = client.db("protocolo_tirano_db");
        usersCollection = db.collection('users');
        gamesCollection = db.collection('games');

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
                    committedTokens: 0, tokenFragments: 0, totalVersatilityScore: 0
                });
            }
        }
        console.log("Verificación de usuarios completada.");

        const apiRouter = express.Router();
        
        apiRouter.post('/login', async (req, res) => {
            const { username, password } = req.body;
            const user = await usersCollection.findOne({ username });
            if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ message: 'Credenciales incorrectas' });
            const accessToken = jwt.sign({ username: user.username, name: user.name, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({ accessToken });
        });
        
        apiRouter.use(authenticateToken);

        apiRouter.get('/state', async (req, res) => {
            try {
                const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
                const games = await gamesCollection.find({}).toArray();
                res.json({ users, games, currentUser: req.user });
            } catch (error) {
                res.status(500).json({ message: "Error interno del servidor."});
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
            if (req.user.isAdmin) return res.status(403).json({ message: 'El admin no puede añadir juegos.' });
            await gamesCollection.insertOne({ 
                name: req.body.name, status: 'voting', votes: {}, totalScore: 0, changeLog: {} 
            });
            res.status(201).json({ message: 'Juego añadido. La votación ha comenzado.' });
        });

        apiRouter.post('/games/:id/vote', async (req, res) => {
            if (req.user.isAdmin) return res.status(403).json({ message: 'El admin no puede votar.' });
            
            const gameId = req.params.id;
            const newVote = req.body.vote;
            
            const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
            if (!game || (game.status !== 'voting' && game.status !== 'active')) {
                return res.status(400).json({ message: 'La votación para este juego ha terminado o está vetado.' });
            }
            
            const oldVote = game.votes[req.user.username];
            if (oldVote === newVote) return res.status(200).json({ message: 'El voto no ha cambiado.' });

            const player = await usersCollection.findOne({ username: req.user.username });
            const availableTokens = (player.tokens || 0) - (player.committedTokens || 0);

            if (newVote === 3 && availableTokens < 1) {
                return res.status(403).json({ message: 'No tienes suficientes Tokens disponibles para votar 3.' });
            }

            let committedTokenChange = 0;
            const gameUpdate = {};
            
            if (oldVote !== undefined) {
                if (game.status === 'voting') {
                    gameUpdate[`$inc`] = { [`changeLog.${req.user.username}`]: 1 };
                }
                if (oldVote === 3) committedTokenChange = -1;
            }
            if (newVote === 3) committedTokenChange = 1;

            if(committedTokenChange !== 0){
                await usersCollection.updateOne({ username: req.user.username }, { $inc: { committedTokens: committedTokenChange } });
            }

            gameUpdate[`$set`] = { [`votes.${req.user.username}`]: newVote };
            await gamesCollection.updateOne({ _id: new ObjectId(gameId) }, gameUpdate);
            
            if (game.status === 'active') {
                let prestigeChange = -1; // Penalty for changing
                // Revert old prestige
                if (oldVote === 0) prestigeChange += 0.5;
                if (oldVote === 1) prestigeChange -= 0.5;
                if (oldVote === 2) prestigeChange -= 0.1;
                // Apply new prestige
                if (newVote === 0) prestigeChange -= 0.5;
                if (newVote === 1) prestigeChange += 0.5;
                if (newVote === 2) prestigeChange += 0.1;

                await usersCollection.updateOne({username: req.user.username}, {$inc: {prestige: prestigeChange}});
                await updateGameScore(gameId);
                await recalculateAllScores();
            }

            const updatedGame = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
            const playerCount = await usersCollection.countDocuments({ username: { $ne: 'admin' } });
            
            if (updatedGame.status === 'voting' && Object.keys(updatedGame.votes).length >= playerCount) {
                await finalizeVotes(gameId);
            }
            
            res.status(200).json({ message: 'Voto registrado.' });
        });
        
        apiRouter.post('/games/:id/veto', async (req, res) => {
            const vetoer = await usersCollection.findOne({ username: req.user.username });
            if (vetoer.vetoes < 1) return res.status(403).json({ message: 'No tienes vetos restantes.' });
            
            const game = await gamesCollection.findOne({ _id: new ObjectId(req.params.id) });
            if (!game || game.status !== 'active') return res.status(403).json({ message: 'Solo se pueden vetar juegos activos.' });
            if (game.votes[req.user.username] !== 0) return res.status(403).json({ message: 'Debes haber votado 0 para poder vetar.' });

            await usersCollection.updateOne({ username: req.user.username }, { $inc: { vetoes: -1 } });
            await gamesCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: 'vetoed', vetoedBy: req.user.username } });
            
            res.status(200).json({ message: 'Juego vetado con éxito.' });
        });
        
        // --- RUTAS DE ADMINISTRADOR ---
        apiRouter.post('/admin/games/:id/reveal', isAdmin, async (req, res) => {
            try {
                const game = await gamesCollection.findOne({ _id: new ObjectId(req.params.id) });
                if (game && game.status === 'voting') {
                    await finalizeVotes(req.params.id);
                    res.status(200).json({ message: 'Votación finalizada por el admin.' });
                } else {
                    res.status(400).json({ message: 'Este juego no está en votación o no existe.' });
                }
            } catch (error) {
                res.status(500).json({ message: "Error interno del servidor al finalizar la votación."});
            }
        });
        
        apiRouter.post('/admin/reset-password', isAdmin, async (req, res) => {
            const { username, newPassword } = req.body;
            await usersCollection.updateOne({ username }, { $set: { password: await bcrypt.hash(newPassword, 10) } });
            res.status(200).json({ message: `Contraseña de ${username} actualizada.` });
        });

        apiRouter.delete('/admin/games/:id', isAdmin, async (req, res) => {
            await gamesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
            await recalculateAllScores(); 
            res.status(200).json({ message: 'Juego eliminado permanentemente.' });
        });

        apiRouter.post('/admin/update-stats', isAdmin, async (req, res) => {
            const { username, tokens, vetoes, prestige, committedTokens, tokenFragments } = req.body;
            await usersCollection.updateOne({ username }, { $set: { 
                tokens: parseInt(tokens), vetoes: parseInt(vetoes), 
                prestige: parseFloat(prestige), committedTokens: parseInt(committedTokens || 0),
                tokenFragments: parseInt(tokenFragments || 0)
            }});
            await recalculateAllScores();
            res.status(200).json({ message: `Estadísticas de ${username} actualizadas.` });
        });

        apiRouter.post('/admin/reset-all', isAdmin, async (req, res) => {
            await gamesCollection.deleteMany({});
            await usersCollection.updateMany({ username: { $ne: 'admin' } }, { $set: { 
                tokens: 3, vetoes: 1, prestige: 0, committedTokens: 0, tokenFragments: 0, totalVersatilityScore: 0 
            }});
            res.status(200).json({ message: 'Aplicación reseteada a valores por defecto.' });
        });
        
        apiRouter.post('/admin/games/:id/unveto', isAdmin, async (req, res) => {
            const game = await gamesCollection.findOne({ _id: new ObjectId(req.params.id) });
            if (!game || game.status !== 'vetoed') return res.status(400).json({ message: 'Este juego no está vetado.' });
            
            await usersCollection.updateOne({ username: game.vetoedBy }, { $inc: { vetoes: 1 } });
            await gamesCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: 'active' }, $unset: { vetoedBy: "" } });
            
            await recalculateAllScores(); 
            
            res.status(200).json({ message: `Veto levantado. ${game.vetoedBy} ha recuperado su Veto.` });
        });
        
        app.use('/api', apiRouter);
        app.use(express.static(path.join(__dirname, 'docs')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'docs', 'index.html'));
        });

        app.listen(port, () => console.log(`Servidor escuchando en http://localhost:${port}`));
    } catch (e) { console.error("Fallo al iniciar el servidor:", e); }
}

main().catch(console.error);
