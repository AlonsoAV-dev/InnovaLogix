import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'reports_db',
    password: process.env.DB_PASSWORD || 'mollendo1',
    port: parseInt(process.env.DB_PORT) || 5433,
});

console.log(`📊 [reports-service] DB Config: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`);



pool.on('connect', async () => {
    console.log(`✅ [reports-service] Connected to PostgreSQL`);
    try {


        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                action VARCHAR(100) NOT NULL,
                resource VARCHAR(255) NOT NULL,
                details JSONB,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                previous_hash VARCHAR(64),
                hash VARCHAR(64) UNIQUE
            );
        `);
        console.log(`✅ [reports-service] Audit table ready (Schema Updated)`);
    } catch (err) {
        console.error(`❌ [reports-service] Error creating audit table:`, err);
    }
});


export default pool;
