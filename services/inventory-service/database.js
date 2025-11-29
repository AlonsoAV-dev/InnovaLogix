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
    database: process.env.DB_DATABASE || 'inventory_db',
    password: process.env.DB_PASSWORD || 'admin123',
    port: parseInt(process.env.DB_PORT) || 5432,
});

console.log(`📊 [${process.env.SERVICE_NAME}] DB Config:`, {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

pool.on('connect', () => {
    console.log(`✅ [${process.env.SERVICE_NAME}] Connected to PostgreSQL database`);
});

pool.on('error', (err) => {
    console.error(`❌ [${process.env.SERVICE_NAME}] Unexpected database error:`, err);
});

// Initialize database schema
export const initDB = async () => {
    try {
        console.log(`🔄 [${process.env.SERVICE_NAME}] Testing database connection...`);
        await pool.query('SELECT NOW()');
        console.log(`✅ [${process.env.SERVICE_NAME}] Database connection successful`);

        // Run schema
        console.log(`🔄 [${process.env.SERVICE_NAME}] Running schema.sql...`);
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await pool.query(schemaSQL);
        console.log(`✅ [${process.env.SERVICE_NAME}] Schema created successfully`);

        // Check if we need to seed data
        const result = await pool.query("SELECT COUNT(*) as count FROM products");
        if (parseInt(result.rows[0].count) === 0) {
            console.log(`🌱 [${process.env.SERVICE_NAME}] Seeding initial data...`);
            const dataSQL = fs.readFileSync(path.join(__dirname, 'data.sql'), 'utf8');
            await pool.query(dataSQL);
            console.log(`✅ [${process.env.SERVICE_NAME}] Data seeded successfully`);
        }

        console.log(`🎉 [${process.env.SERVICE_NAME}] Database initialized successfully`);
    } catch (err) {
        console.error(`❌ [${process.env.SERVICE_NAME}] Error initializing database:`, err.message);
        process.exit(1);
    }
};

export default pool;
