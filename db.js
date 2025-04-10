import mysql from 'mysql2/promise'; // Usamos la versión Promise
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración del pool de conexiones MySQL
const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    queueLimit: 0
});

// Verificación de la conexión a la base de datos
const verifyDB = async () => {
    try {
        const conn = await db.getConnection();
        console.log('✅ Conectado a MySQL como ID', conn.connection.threadId);
        conn.release();
    } catch (err) {
        console.error('⚠️ Error de conexión MySQL:', err);
        process.exit(1); // Salir del proceso si hay error en la conexión
    }
};

// Exportar la configuración de la base de datos y la función de verificación
export { db, verifyDB };
