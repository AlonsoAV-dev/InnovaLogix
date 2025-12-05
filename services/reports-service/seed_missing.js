import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'reports_db',
    password: 'mollendo1',
    port: 5433,
});

const missingProducts = [
    // Supplier 1 (Outdoor Gear Peru)
    { supplierid: 1, productid: 6, productname: 'Carpa 2 Personas', price: 110.00, stock: 15 },
    { supplierid: 1, productid: 8, productname: 'Gas Butano 230g', price: 12.00, stock: 100 },

    // Supplier 2 (Importaciones Andinas)
    { supplierid: 2, productid: 7, productname: 'Botas Trekking T42', price: 160.00, stock: 20 },
    { supplierid: 2, productid: 8, productname: 'Gas Butano 230g', price: 11.50, stock: 50 },

    // Supplier 3 (Textiles del Sur)
    { supplierid: 3, productid: 5, productname: 'Chaqueta Impermeable', price: 90.00, stock: 30 }
];

const seedMissing = async () => {
    try {
        console.log("Connecting to DB...");
        for (const p of missingProducts) {
            // Check if exists
            const res = await pool.query(
                "SELECT * FROM supplier_products WHERE supplierid = $1 AND productid = $2",
                [p.supplierid, p.productid]
            );

            if (res.rows.length === 0) {
                await pool.query(
                    "INSERT INTO supplier_products (supplierid, productid, productname, price, stock) VALUES ($1, $2, $3, $4, $5)",
                    [p.supplierid, p.productid, p.productname, p.price, p.stock]
                );
                console.log(`✅ Added ${p.productname} for Supplier ${p.supplierid}`);
            } else {
                console.log(`⚠️ ${p.productname} already exists for Supplier ${p.supplierid}`);
            }
        }
        console.log("Done!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding:", err);
        process.exit(1);
    }
};

seedMissing();
