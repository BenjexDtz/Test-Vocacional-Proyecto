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

const app = express();

const whitelist = process.env.FRONTEND_URLS 
    ? process.env.FRONTEND_URLS.split(',') 
    : (process.env.NODE_ENV === 'production'
        ? ['https://tudominio.com']
        : ['http://localhost:3000', 'http://localhost:4200']);

app.use(cors({
    origin: function (origin, callback) {
        // Permitir solicitudes sin origen (como apps móviles o curl)
        if (!origin) return callback(null, true);
        
        if (whitelist.some(domain => origin.startsWith(domain))) {
            callback(null, true);
        } else {
            console.warn(`Intento de acceso no autorizado desde: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Configuración de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// Verificar conexión a la base de datos
verifyDB();

// Endpoints API
// Modifica el endpoint /api/preguntas para que devuelva la estructura que espera el frontend
app.get('/api/preguntas', async (req, res) => {
    try {
        // Primero obtener categorías
        const [categorias] = await db.query('SELECT * FROM categorias ORDER BY id');
        
        // Luego obtener preguntas
        const [preguntas] = await db.query(`
            SELECT p.id, p.texto, p.categoria_id, c.nombre AS categoria 
            FROM preguntas p
            JOIN categorias c ON p.categoria_id = c.id
            ORDER BY p.id
        `);
        
        // Organizar preguntas por categoría como espera el frontend
        const resultado = categorias.map(categoria => ({
            id: categoria.id,
            nombre: categoria.nombre,
            preguntas: preguntas
                .filter(p => p.categoria_id === categoria.id)
                .map(p => ({ id: p.id, texto: p.texto }))
        }));

        res.json({ 
            success: true, 
            categorias: resultado 
        });
    } catch (error) {
        console.error('Error al obtener preguntas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener preguntas',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

app.post('/api/guardar-respuestas', async (req, res) => {
    const { usuario, correo, respuestas } = req.body;

    // Validaciones mejoradas
    if (!usuario || typeof usuario !== 'string' || usuario.trim().length < 3) {
        return res.status(400).json({ 
            success: false,
            error: 'Nombre de usuario inválido (mínimo 3 caracteres)'
        });
    }

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        return res.status(400).json({ 
            success: false,
            error: 'Correo electrónico inválido'
        });
    }

    if (!respuestas || typeof respuestas !== 'object' || Object.keys(respuestas).length !== 66) {
        return res.status(400).json({ 
            success: false,
            error: 'Debes responder todas las 66 preguntas'
        });
    }

    try {
        await db.query('START TRANSACTION');

        // Registrar usuario
        const [userResult] = await db.query(
            `INSERT INTO usuarios (nombre, correo) 
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE usuario_id=LAST_INSERT_ID(usuario_id)`,
            [usuario.trim(), correo.trim()]
        );

        const usuarioId = userResult.insertId;

        // Preparar respuestas para inserción
        const valores = Object.entries(respuestas).map(([pregunta_id, respuesta]) => [
            usuarioId,
            parseInt(pregunta_id),
            parseInt(respuesta)
        ]);

        // Insertar respuestas
        const [result] = await db.query(
            `INSERT INTO respuestas (usuario_id, pregunta_id, respuesta) 
             VALUES ?`,
            [valores]
        );

        await db.query('COMMIT');

        res.json({
            success: true,
            usuarioId,
            insertedCount: result.affectedRows
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error en guardar-respuestas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al guardar respuestas',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

app.get('/resultado/:usuarioId', async (req, res) => {
    try {
        const usuarioId = req.params.usuarioId;

        // Obtener resultados por categoría
        const [resultados] = await db.query(`
            SELECT 
                c.nombre AS categoria,
                SUM(r.respuesta) AS puntaje_total
            FROM 
                respuestas r
            JOIN 
                categorias c ON r.pregunta_id BETWEEN 
                    CASE c.id
                        WHEN 1 THEN 1
                        WHEN 2 THEN 12
                        WHEN 3 THEN 23
                        WHEN 4 THEN 34
                        WHEN 5 THEN 45
                        WHEN 6 THEN 56
                    END AND
                    CASE c.id
                        WHEN 1 THEN 11
                        WHEN 2 THEN 22
                        WHEN 3 THEN 33
                        WHEN 4 THEN 44
                        WHEN 5 THEN 55
                        WHEN 6 THEN 66
                    END
            WHERE 
                r.usuario_id = ?
            GROUP BY 
                c.id
            ORDER BY 
                puntaje_total DESC
            LIMIT 1
        `, [usuarioId]);

        if (!resultados.length) {
            return res.status(404).json({ 
                success: false,
                error: 'No se encontraron resultados para este usuario' 
            });
        }

        res.json({
            success: true,
            area_recomendada: resultados[0].categoria,
            puntaje: resultados[0].puntaje_total
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

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error global:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? err.message : null
    });
});

// Iniciar servidor
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`🚀 Servidor listo en http://localhost:${port}`);
    console.log(`📊 Endpoints disponibles:`);
    console.log(`- GET  /api/preguntas`);
    console.log(`- POST /api/guardar-respuestas`);
    console.log(`- GET  /resultado/:usuarioId`);
});