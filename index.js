import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { db, verifyDB } from './db.js';
import { fileURLToPath } from 'url';

// Configuración inicial
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
console.log(process.env.DB_HOST);

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tudominio.com'] 
        : ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Servir Bootstrap desde node_modules
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));

// Pool de conexiones MySQL (versión Promise)
verifyDB();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'));
});


// Endpoint mejorado para guardar respuestas
app.post('/api/guardar-respuestas', async (req, res) => {
    const { usuario, respuestas } = req.body;

    if (!usuario || typeof usuario !== 'string' || usuario.trim().length < 3) {
        return res.status(400).json({ 
            success: false,
            error: 'Nombre de usuario inválido (mínimo 3 caracteres)'
        });
    }

    if (!respuestas || typeof respuestas !== 'object' || Object.keys(respuestas).length === 0) {
        return res.status(400).json({ 
            success: false,
            error: 'Formato de respuestas inválido'
        });
    }

    try {
        const valores = Object.entries(respuestas).map(([pregunta_id, respuesta]) => [
            usuario.trim(),
            parseInt(pregunta_id),
            String(respuesta)
        ]);

        const [result] = await db.query(
            `INSERT INTO respuestas (usuario, pregunta_id, respuesta) VALUES ?`,
            [valores]
        );

        if (result.affectedRows > 0) {
            return res.json({ 
                success: true,
                insertedCount: result.affectedRows
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'No se insertaron respuestas'
            });
        }
    } catch (error) {
        console.error('Error en guardar-respuestas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al guardar respuestas',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});


// Endpoint optimizado para resultados
app.get('/resultado/:usuario', async (req, res) => {
    const usuario = req.params.usuario;

    try {
        const [results] = await db.query(
            `SELECT 
                CASE
                    WHEN SUM(respuesta = 'tecnologia') > 0 THEN 'Tecnología'
                    WHEN SUM(respuesta = 'sociales') > 0 THEN 'Ciencias Sociales'
                    WHEN SUM(respuesta = 'humanidades') > 0 THEN 'Humanidades'
                    ELSE 'General'
                END AS area_recomendada
             FROM respuestas
             WHERE usuario = ?
             GROUP BY usuario`,
            [usuario]
        );

        if (!results.length) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuario no encontrado' 
            });
        }

        res.json({
            success: true,
            usuario,
            area_recomendada: results[0].area_recomendada || 'General',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en resultado:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al calcular resultado',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

// Manejo de errores centralizado
app.use((err, req, res, next) => {
    console.error('Error global:', err);
    res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? err.message : null
    });
});


// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor listo en http://localhost:${PORT}`);
    console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}\n`);
});
