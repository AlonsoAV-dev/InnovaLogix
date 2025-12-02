import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Client } = pg;

const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'reports_db',
    password: process.env.DB_PASSWORD || 'mollendo1',
    port: parseInt(process.env.DB_PORT) || 5433,
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const query = `
            SELECT 
                TO_CHAR(s.date, 'YYYY-MM') as month,
                SUM(si.quantity * si.price) as revenue,
                SUM(si.quantity * p.cost) as cost
            FROM sales s
            JOIN sale_items si ON s.id = si.saleid
            JOIN products p ON si.productid = p.id
            GROUP BY TO_CHAR(s.date, 'YYYY-MM')
            ORDER BY month ASC
        `;

        console.log('Running query...');
        const res = await client.query(query);
        console.log('Query successful!');
        console.log('Rows:', res.rows);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

run();
