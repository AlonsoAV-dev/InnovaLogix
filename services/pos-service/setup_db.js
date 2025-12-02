import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const config = {
    user: 'postgres',
    host: 'localhost',
    password: 'mollendo1',
    port: 5433,
};

const DB_NAME = 'reports_db';

async function setup() {
    console.log('🔄 Connecting to PostgreSQL...');
    const client = new Client(config);

    try {
        await client.connect();

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`✨ Creating database ${DB_NAME}...`);
            await client.query(`CREATE DATABASE ${DB_NAME}`);
        } else {
            console.log(`ℹ️ Database ${DB_NAME} already exists.`);
        }

        await client.end();

        // Connect to the new database
        console.log(`🔄 Connecting to ${DB_NAME}...`);
        const dbClient = new Client({ ...config, database: DB_NAME });
        await dbClient.connect();

        // Read Schemas
        const rootDir = path.join(__dirname, '..', '..');
        const servicesDir = path.join(rootDir, 'services');

        const schemas = [
            path.join(servicesDir, 'inventory-service', 'schema.sql'),
            path.join(servicesDir, 'crm-service', 'schema.sql'),
            path.join(servicesDir, 'purchases-service', 'schema.sql'),
            path.join(servicesDir, 'pos-service', 'schema.sql')
        ];

        console.log('🔄 Applying schemas...');
        for (const schemaPath of schemas) {
            if (fs.existsSync(schemaPath)) {
                console.log(`   📄 Running ${path.basename(path.dirname(schemaPath))}/schema.sql`);
                const sql = fs.readFileSync(schemaPath, 'utf8');
                await dbClient.query(sql);
            } else {
                console.warn(`   ⚠️ Schema not found: ${schemaPath}`);
            }
        }

        // Run Seed
        const seedPath = path.join(rootDir, 'seed.sql');
        if (fs.existsSync(seedPath)) {
            console.log('🌱 Seeding data...');
            const seedSql = fs.readFileSync(seedPath, 'utf8');
            await dbClient.query(seedSql);
            console.log('✅ Data seeded successfully!');
        } else {
            console.warn('⚠️ seed.sql not found at ' + seedPath);
        }

        await dbClient.end();
        console.log('🎉 Setup complete!');

    } catch (err) {
        console.error('❌ Error:', err);
        if (client) await client.end();
    }
}

setup();
