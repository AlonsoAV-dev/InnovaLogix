import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'ads_db',
    password: process.env.DB_PASSWORD || 'admin123',
    port: parseInt(process.env.DB_PORT) || 5432,
});

console.log("DB Config:", {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    passwordSet: !!process.env.DB_PASSWORD
});

pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err, client) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

const initDB = async () => {
    try {
        // Test connection first
        console.log('🔄 Testing database connection...');
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');

        // Products Table
        await pool.query(`CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT,
            price REAL,
            cost REAL,
            stock INTEGER,
            minStock INTEGER,
            category TEXT,
            image TEXT
        )`);

        // Sales Table
        await pool.query(`CREATE TABLE IF NOT EXISTS sales (
            id SERIAL PRIMARY KEY,
            date TEXT,
            total REAL,
            items INTEGER,
            paymentMethod TEXT,
            receiptType TEXT,
            receiptNumber TEXT,
            clientName TEXT,
            clientDoc TEXT,
            clientAddress TEXT
        )`);

        // Sale Items Table
        await pool.query(`CREATE TABLE IF NOT EXISTS sale_items (
            id SERIAL PRIMARY KEY,
            saleId INTEGER REFERENCES sales(id),
            productName TEXT,
            quantity INTEGER,
            price REAL
        )`);

        // Customers Table
        await pool.query(`CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            name TEXT,
            email TEXT,
            phone TEXT,
            type TEXT,
            points INTEGER,
            totalPurchases REAL,
            lastVisit TEXT
        )`);

        // Suppliers Table
        await pool.query(`CREATE TABLE IF NOT EXISTS suppliers (
            id SERIAL PRIMARY KEY,
            name TEXT,
            ruc TEXT,
            contact TEXT,
            phone TEXT,
            email TEXT
        )`);

        // Purchases Table
        await pool.query(`CREATE TABLE IF NOT EXISTS purchases (
            id SERIAL PRIMARY KEY,
            supplierId INTEGER REFERENCES suppliers(id),
            supplierName TEXT,
            total REAL,
            date TEXT,
            invoiceNumber TEXT,
            status TEXT,
            estimatedDelivery TEXT
        )`);

        // Purchase Items Table
        await pool.query(`CREATE TABLE IF NOT EXISTS purchase_items (
            id SERIAL PRIMARY KEY,
            purchaseId INTEGER REFERENCES purchases(id),
            productId INTEGER,
            productName TEXT,
            quantity INTEGER,
            cost REAL
        )`);

        // Claims Table
        await pool.query(`CREATE TABLE IF NOT EXISTS claims (
            id SERIAL PRIMARY KEY,
            customerId INTEGER,
            type TEXT,
            product TEXT,
            reason TEXT,
            status TEXT,
            date TEXT,
            resolution TEXT
        )`);

        // Surveys Table
        await pool.query(`CREATE TABLE IF NOT EXISTS surveys (
            id SERIAL PRIMARY KEY,
            customerId INTEGER,
            rating INTEGER,
            comment TEXT,
            date TEXT
        )`);

        // Supplier Products Table (Prices)
        await pool.query(`CREATE TABLE IF NOT EXISTS supplier_products (
            id SERIAL PRIMARY KEY,
            supplierId INTEGER REFERENCES suppliers(id),
            productId INTEGER REFERENCES products(id),
            price REAL,
            stock INTEGER
        )`);

        // Inventory Movements Table (Kardex)
        await pool.query(`CREATE TABLE IF NOT EXISTS inventory_movements (
            id SERIAL PRIMARY KEY,
            productId INTEGER REFERENCES products(id),
            type TEXT,
            quantity INTEGER,
            previousStock INTEGER,
            newStock INTEGER,
            reference TEXT,
            timestamp TEXT
        )`);

        // Seed Products
        const resProducts = await pool.query("SELECT count(*) as count FROM products");
        if (parseInt(resProducts.rows[0].count) === 0) {
            console.log("Seeding products...");
            const products = [
                { name: 'Carpa 4 Personas', price: 250.00, cost: 180.00, stock: 15, minStock: 5, category: 'Camping', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&q=80' },
                { name: 'Saco de Dormir', price: 120.00, cost: 80.00, stock: 25, minStock: 8, category: 'Camping', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80' },
                { name: 'Linterna LED', price: 45.00, cost: 25.00, stock: 50, minStock: 15, category: 'Accesorios', image: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=500&q=80' },
                { name: 'Mochila Trekking', price: 180.00, cost: 120.00, stock: 10, minStock: 3, category: 'Trekking', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80' },
                { name: 'Botas Trekking', price: 280.00, cost: 200.00, stock: 12, minStock: 4, category: 'Calzado', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80' },
                { name: 'Casaca Térmica', price: 350.00, cost: 250.00, stock: 8, minStock: 2, category: 'Ropa', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80' }
            ];

            for (const p of products) {
                await pool.query(
                    "INSERT INTO products (name, price, cost, stock, minStock, category, image) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                    [p.name, p.price, p.cost, p.stock, p.minStock, p.category, p.image]
                );
            }
        }

        // Seed Customers
        const resCustomers = await pool.query("SELECT count(*) as count FROM customers");
        if (parseInt(resCustomers.rows[0].count) === 0) {
            console.log("Seeding customers...");
            const customers = [
                { name: 'Juan Pérez', email: 'juan@mail.com', phone: '999888777', type: 'Frecuente', points: 120, totalPurchases: 1500, lastVisit: '2023-11-20' },
                { name: 'Maria Lopez', email: 'maria@mail.com', phone: '999111222', type: 'Nuevo', points: 50, totalPurchases: 300, lastVisit: '2023-11-22' },
                { name: 'Carlos Ruiz', email: 'carlos@mail.com', phone: '999333444', type: 'Mayorista', points: 500, totalPurchases: 5000, lastVisit: '2023-11-18' }
            ];

            for (const c of customers) {
                await pool.query(
                    "INSERT INTO customers (name, email, phone, type, points, totalPurchases, lastVisit) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                    [c.name, c.email, c.phone, c.type, c.points, c.totalPurchases, c.lastVisit]
                );
            }
        }

        // Seed Suppliers
        const resSuppliers = await pool.query("SELECT count(*) as count FROM suppliers");
        // Check if we have the 3rd supplier
        const resSupplier3 = await pool.query("SELECT * FROM suppliers WHERE id = 3");

        if (parseInt(resSuppliers.rows[0].count) === 0) {
            console.log("Seeding suppliers...");
            const suppliers = [
                { name: 'Outdoor Peru S.A.C.', ruc: '20123456789', contact: 'Juan Perez', phone: '987654321', email: 'ventas@outdoorperu.com' },
                { name: 'Importaciones Andinas', ruc: '20987654321', contact: 'Maria Lopez', phone: '912345678', email: 'contacto@andinas.com' },
                { name: 'Equipamiento Total', ruc: '20555666777', contact: 'Pedro Gomez', phone: '955444333', email: 'ventas@eqtotal.com' }
            ];

            for (const s of suppliers) {
                await pool.query(
                    "INSERT INTO suppliers (name, ruc, contact, phone, email) VALUES ($1, $2, $3, $4, $5)",
                    [s.name, s.ruc, s.contact, s.phone, s.email]
                );
            }
        } else if (resSupplier3.rowCount === 0) {
            // If table not empty but missing 3rd supplier (e.g. from previous run), insert it
            console.log("Adding missing supplier 3...");
            await pool.query(
                "INSERT INTO suppliers (id, name, ruc, contact, phone, email) VALUES (3, 'Equipamiento Total', '20555666777', 'Pedro Gomez', '955444333', 'ventas@eqtotal.com') ON CONFLICT (id) DO NOTHING"
            );
        }

        // MATERIALIZED VIEWs para los reportes

        // Ventas por día

        await pool.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS ventas_diarias_mv AS
            SELECT 
                s.date::date AS dia,
                SUM(s.total) AS total_ventas,
                COUNT(*) AS cantidad_ventas
            FROM sales s
            GROUP BY dia
            ORDER BY dia DESC;
        `);

        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_diarias_mv_dia 
            ON ventas_diarias_mv (dia);
        `);


        // Top productos más vendidos

        await pool.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS top_productos_mv AS
            SELECT 
                si.productName AS producto,
                SUM(si.quantity) AS total_vendido,
                SUM(si.price * si.quantity) AS total_recaudado
            FROM sale_items si
            GROUP BY si.productName
            ORDER BY total_vendido DESC;
        `);

        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_top_productos_mv_producto 
            ON top_productos_mv (producto);
        `);


        // detalles

        await pool.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS ventas_detalle_mv AS
            SELECT 
                s.id AS sale_id,
                s.date,
                s.paymentMethod,
                s.total,
                COUNT(si.id) AS total_items,
                SUM(si.quantity) AS total_unidades
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.saleId
            GROUP BY s.id, s.date, s.paymentMethod, s.total
            ORDER BY s.date DESC;
        `);

        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_detalle_mv_sale_id 
            ON ventas_detalle_mv (sale_id);
        `);

        
        // MATERIALIZED VIEWs para los reportes

        

        // Seed Supplier Products (Prices)
        const resSupplierProducts = await pool.query("SELECT count(*) as count FROM supplier_products");
        if (parseInt(resSupplierProducts.rows[0].count) === 0) {
            console.log("Seeding supplier prices...");

            // Ensure we have products 1-6
            const pCount = await pool.query("SELECT count(*) as count FROM products");
            if (parseInt(pCount.rows[0].count) >= 6) {
                // Supplier 1: Outdoor Peru
                await pool.query("INSERT INTO supplier_products (supplierId, productId, price, stock) VALUES (1, 1, 175.00, 50)"); // Carpa
                await pool.query("INSERT INTO supplier_products (supplierId, productId, price, stock) VALUES (1, 2, 75.00, 25)"); // Saco
                await pool.query("INSERT INTO supplier_products (supplierId, productId, price, stock) VALUES (1, 3, 22.00, 100)"); // Linterna

                // Supplier 2: Importaciones Andinas
                await pool.query("INSERT INTO supplier_products (supplierId, productId, price, stock) VALUES (2, 1, 170.00, 10)"); // Carpa (cheaper)
                await pool.query("INSERT INTO supplier_products (supplierId, productId, price, stock) VALUES (2, 4, 115.00, 20)"); // Mochila
                await pool.query("INSERT INTO supplier_products (supplierId, productId, price, stock) VALUES (2, 5, 195.00, 15)"); // Botas

                // Supplier 3: Equipamiento Total
                // Check if supplier 3 exists again just in case
                const s3 = await pool.query("SELECT id FROM suppliers WHERE id = 3");
                if (s3.rowCount > 0) {
                    await pool.query("INSERT INTO supplier_products (supplierId, productId, price, stock) VALUES (3, 2, 78.00, 30)"); // Saco
                    await pool.query("INSERT INTO supplier_products (supplierId, productId, price, stock) VALUES (3, 3, 20.00, 100)"); // Linterna (cheaper)
                    await pool.query("INSERT INTO supplier_products (supplierId, productId, price, stock) VALUES (3, 6, 240.00, 15)"); // Casaca
                }
            }
        }

        console.log("Database initialized successfully");

    } catch (err) {
        console.error("❌ Error initializing database:", err.message);
        console.error("Full error:", err);
        console.error("\n🔧 Troubleshooting:");
        console.error("1. Verify PostgreSQL is running");
        console.error("2. Check credentials in .env file");
        console.error("3. Ensure database 'ads_db' exists");
        console.error("4. Test connection: psql -U postgres -d ads_db");
        process.exit(1);
    }
};

initDB();

export default pool;
