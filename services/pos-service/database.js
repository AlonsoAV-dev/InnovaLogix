import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'pos_db',
    password: process.env.DB_PASSWORD || 'admin123',
    port: parseInt(process.env.DB_PORT) || 5432,
});

console.log(`📊 [${process.env.SERVICE_NAME}] DB: ${process.env.DB_DATABASE}`);

pool.on('connect', () => {
    console.log(`✅ [${process.env.SERVICE_NAME}] Connected to PostgreSQL`);
});

export const initDB = async () => {
    try {
        await pool.query('SELECT NOW()');
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await pool.query(schemaSQL);
        
        const result = await pool.query("SELECT COUNT(*) as count FROM sales");
        if (parseInt(result.rows[0].count) === 0) {
            const dataSQL = fs.readFileSync(path.join(__dirname, 'data.sql'), 'utf8');
            await pool.query(dataSQL);
            console.log(`🌱 [${process.env.SERVICE_NAME}] Data seeded`);
        }
        
        console.log(`🎉 [${process.env.SERVICE_NAME}] Database initialized`);
    } catch (err) {
        console.error(`❌ [${process.env.SERVICE_NAME}] DB Error:`, err.message);
        process.exit(1);
    }
};

export default pool;
