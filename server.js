// Importa las dependencias necesarias
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config(); // Carga las variables de entorno desde .env

// Configuración inicial
const app = express();
const port = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGODB_URI);

// Middleware para permitir peticiones de otros orígenes (CORS),
// parsear JSON y servir los ficheros estáticos del frontend.
app.use(cors());
app.use(express.json());
app.use(express.static('docs'));

let db;

// Función principal para conectar a la base de datos y arrancar el servidor
async function main() {
    try {
        await client.connect();
        console.log("Conectado a MongoDB Atlas");
        db = client.db("protocolo_tirano_db"); // Puedes nombrar tu base de datos aquí

        // Inicializar colecciones si no existen
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        if (!collectionNames.includes('players')) {
            await db.collection('players').insertMany([
                 { _id: 'david', name: 'David', score: 0 },
                 { _id: 'pablo', name: 'Pablo', score: 0 },
                 { _id: 'sergio', name: 'Sergio', score: 0 },
                 { _id: 'miguel', name: 'Miguel', score: 0 },
            ]);
        }
        if (!collectionNames.includes('games')) {
            await db.createCollection('games');
        }


        // --- DEFINICIÓN DE RUTAS DE LA API ---

        // GET /api/state: Obtiene el estado completo de la aplicación
        app.get('/api/state', async (req, res) => {
            try {
                const players = await db.collection('players').find({}).toArray();
                const games = await db.collection('games').find({}).toArray();
                res.json({ players, games });
            } catch (error) {
                res.status(500).json({ message: "Error al obtener el estado", error });
            }
        });

        // POST /api/games: Nomina un nuevo juego
        app.post('/api/games', async (req, res) => {
            const { name } = req.body;
            if (!name) return res.status(400).json({ message: "El nombre es requerido" });

            const newGame = {
                name,
                status: 'pending_vote',
                votes: {},
                totalScore: 0,
                nominatedBy: null // Se podría añadir quién lo nominó
            };
            try {
                const result = await db.collection('games').insertOne(newGame);
                res.status(201).json(result);
            } catch (error) {
                res.status(500).json({ message: "Error al nominar el juego", error });
            }
        });

        // POST /api/games/:id/vote: Registra los votos para un juego
        app.post('/api/games/:id/vote', async (req, res) => {
            const { id } = req.params;
            const { votes } = req.body; // votes: { david: 3, pablo: 2, ... }
            
            try {
                const result = await db.collection('games').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { votes: votes, status: 'active' } }
                );
                // Aquí también se debería actualizar el score de cada jugador
                // Por simplicidad, el score se puede calcular en el frontend,
                // pero lo ideal sería una transacción que actualice todo.
                res.json(result);
            } catch (error) {
                 res.status(500).json({ message: "Error al registrar el voto", error });
            }
        });
        
        // Y así sucesivamente para las demás acciones (veto, cancelación, etc.)

        // Inicia el servidor
        app.listen(port, () => {
            console.log(`Servidor escuchando en http://localhost:${port}`);
        });

    } catch (e) {
        console.error(e);
    }
}

main().catch(console.error);
