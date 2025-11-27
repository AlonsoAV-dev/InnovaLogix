import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './database.js';
import cron from "node-cron";


const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Stock cache for faster reads
const stockCache = new Map();

// Function to update stock cache
async function refreshStockCache() {
    try {
        const result = await pool.query("SELECT id, name, stock FROM products");
        result.rows.forEach(product => {
            stockCache.set(product.id, { name: product.name, stock: product.stock });
        });
        console.log(`Stock cache refreshed with ${stockCache.size} products`);
    } catch (err) {
        console.error("Error refreshing stock cache:", err);
    }
}

// Initialize cache on startup
refreshStockCache();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.use(cors());
app.use(bodyParser.json());

// --- PRODUCTS ---
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products");
        res.json(result.rows);
    } catch (err) {
        console.error("Error in GET /api/products:", err);
        res.status(500).json({ error: err.message });
    }
});

// New endpoint for fast stock check using cache
app.get('/api/products/stock/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (stockCache.has(productId)) {
            res.json(stockCache.get(productId));
        } else {
            const result = await pool.query("SELECT id, name, stock FROM products WHERE id = $1", [productId]);
            if (result.rows.length > 0) {
                const product = result.rows[0];
                stockCache.set(productId, { name: product.name, stock: product.stock });
                res.json({ name: product.name, stock: product.stock });
            } else {
                res.status(404).json({ error: "Product not found" });
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    const { name, price, cost, stock, minStock, category, image } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO products (name, price, cost, stock, minStock, category, image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [name, price, cost, stock, minStock, category, image]
        );
        
        // Update cache
        const newProduct = result.rows[0];
        stockCache.set(newProduct.id, { name: newProduct.name, stock: newProduct.stock });
        
        // Notify all clients
        io.emit('stockUpdate', { 
            productId: newProduct.id, 
            productName: newProduct.name, 
            stock: newProduct.stock,
            action: 'created'
        });
        
        res.json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    const { name, price, cost, stock, minStock, category, image } = req.body;
    try {
        const result = await pool.query(
            "UPDATE products SET name = $1, price = $2, cost = $3, stock = $4, minStock = $5, category = $6, image = $7 WHERE id = $8 RETURNING *",
            [name, price, cost, stock, minStock, category, image, req.params.id]
        );
        
        // Update cache
        const updatedProduct = result.rows[0];
        stockCache.set(updatedProduct.id, { name: updatedProduct.name, stock: updatedProduct.stock });
        
        // Notify all clients
        io.emit('stockUpdate', { 
            productId: updatedProduct.id, 
            productName: updatedProduct.name, 
            stock: updatedProduct.stock,
            action: 'updated'
        });
        
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);
        
        // Remove from cache
        const productId = parseInt(req.params.id);
        stockCache.delete(productId);
        
        // Notify all clients
        io.emit('stockUpdate', { 
            productId: productId, 
            stock: 0,
            action: 'deleted'
        });
        
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- INVENTORY KARDEX & ALERTS ---
app.get('/api/inventory/kardex/:productId', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM inventory_movements WHERE productId = $1 ORDER BY id DESC",
            [req.params.productId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/inventory/alerts', async (req, res) => {
    try {
        // INV-01: Dynamic Threshold Calculation
        // 1. Calculate Avg Daily Sales (last 30 days)
        // 2. Default Lead Time = 7 days (could be per supplier/product in future)

        const salesData = await pool.query(`
            SELECT si.productName, SUM(si.quantity) as totalSold
            FROM sale_items si
            JOIN sales s ON si.saleId = s.id
            WHERE s.date >= NOW() - INTERVAL '30 days'
            GROUP BY si.productName
        `);

        const products = await pool.query("SELECT * FROM products");

        const alerts = products.rows.map(p => {
            const saleStat = salesData.rows.find(s => s.productname === p.name);
            const totalSold30Days = saleStat ? parseInt(saleStat.totalsold) : 0;
            const avgDailySales = totalSold30Days / 30;
            const leadTimeDays = 7; // Configurable in future

            // Dynamic Minimum Stock
            const dynamicMinStock = Math.ceil(avgDailySales * leadTimeDays);

            // Use the higher of dynamic or static minStock to be safe, or just dynamic
            const effectiveMinStock = Math.max(dynamicMinStock, p.minstock || 0);

            if (p.stock <= effectiveMinStock) {
                return {
                    ...p,
                    avgDailySales: avgDailySales.toFixed(2),
                    dynamicMinStock,
                    effectiveMinStock,
                    suggestedReorder: Math.max(effectiveMinStock * 2 - p.stock, 10) // Simple reorder logic
                };
            }
            return null;
        }).filter(Boolean);

        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SALES ---
app.get('/api/sales', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM sales ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/sales', async (req, res) => {
    const { total, items, paymentMethod, receiptType, receiptNumber, clientData, cartItems } = req.body;
    const date = new Date().toISOString();

    const clientName = clientData ? clientData.name : '';
    const clientDoc = clientData ? clientData.docNumber : '';
    const clientAddress = clientData ? clientData.address : '';

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Insert Sale
        const saleRes = await client.query(
            `INSERT INTO sales (date, total, items, paymentMethod, receiptType, receiptNumber, clientName, clientDoc, clientAddress) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [date, total, items, paymentMethod, receiptType, receiptNumber, clientName, clientDoc, clientAddress]
        );
        const saleId = saleRes.rows[0].id;

        const stockUpdates = []; // Track stock changes for WebSocket

        // Insert Sale Items & Update Stock
        for (const item of cartItems) {
            // Check stock first
            const productRes = await client.query("SELECT id, stock FROM products WHERE name = $1", [item.name]);
            if (productRes.rows.length === 0) {
                throw new Error(`Producto no encontrado: ${item.name}`);
            }
            const productId = productRes.rows[0].id;
            const currentStock = productRes.rows[0].stock;
            if (currentStock < item.quantity) {
                throw new Error(`Stock insuficiente para ${item.name}. Disponible: ${currentStock}, Solicitado: ${item.quantity}`);
            }

            await client.query(
                "INSERT INTO sale_items (saleId, productName, quantity, price) VALUES ($1, $2, $3, $4)",
                [saleId, item.name, item.quantity, item.price]
            );
            await client.query(
                "UPDATE products SET stock = stock - $1 WHERE name = $2",
                [item.quantity, item.name]
            );
            
            // Calculate new stock and update cache
            const newStock = currentStock - item.quantity;
            stockCache.set(productId, { name: item.name, stock: newStock });
            
            stockUpdates.push({ 
                productId, 
                productName: item.name, 
                stock: newStock,
                quantitySold: item.quantity
            });

            // INV-02: Record Movement (Kardex)
            const prodIdRes = await client.query("SELECT id FROM products WHERE name = $1", [item.name]);
            const prodId = prodIdRes.rows[0].id;

            await client.query(
                `INSERT INTO inventory_movements (productId, type, quantity, previousStock, newStock, reference, timestamp)
                 VALUES ($1, 'SALE', $2, $3, $4, $5, $6)`,
                [prodId, -item.quantity, currentStock, currentStock - item.quantity, `Sale #${saleId}`, date]
            );
        }

        await client.query('COMMIT');
        
        // Emit stock updates to all connected clients AFTER successful commit
        stockUpdates.forEach(update => {
            io.emit('stockUpdate', { ...update, action: 'sale' });
        });
        
        console.log(`Sale #${saleId} completed. Stock updates broadcasted to clients.`);
        
        res.json({ id: saleId, message: "Sale recorded" });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// --- TEMPORIZADOR para refrescar los reportes ---
cron.schedule("*/1 * * * *", async () => {
    try {
        console.log("Refreshing Materialized Views...");
        await pool.query("REFRESH MATERIALIZED VIEW CONCURRENTLY ventas_diarias_mv");
        await pool.query("REFRESH MATERIALIZED VIEW CONCURRENTLY top_productos_mv");
        await pool.query("REFRESH MATERIALIZED VIEW CONCURRENTLY ventas_detalle_mv");
        console.log("Views refreshed!");
    } catch (err) {
        console.error("Error refreshing MVs:", err.message);
    }
});
// --- TEMPORIZADOR para refrescar los reportes ---


// --- Ventas por día ---
app.get('/api/reportes/ventas-diarias', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM ventas_diarias_mv ORDER BY dia DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- Ventas por día ---

// --- Top productos ---
app.get('/api/reportes/top-productos', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM top_productos_mv ORDER BY total_vendido DESC LIMIT 10");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- Top productos ---

// --- Ventas individuales ---
app.get('/api/reportes/ventas-detalle', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM ventas_detalle_mv ORDER BY date DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- Ventas individuales ---





// --- CUSTOMERS ---
app.get('/api/customers', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM customers");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SUPPLIERS ---
app.get('/api/suppliers', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM suppliers");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/suppliers', async (req, res) => {
    const { name, ruc, contact, phone, email } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO suppliers (name, ruc, contact, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [name, ruc, contact, phone, email]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PURCHASES ---
app.get('/api/purchases', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, 
            (SELECT json_agg(pi.*) FROM purchase_items pi WHERE pi.purchaseId = p.id) as items 
            FROM purchases p ORDER BY p.id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/purchases', async (req, res) => {
    const { supplierId, supplierName, total, items, invoiceNumber, status, estimatedDelivery } = req.body;
    const date = new Date().toISOString();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const purchaseRes = await client.query(
            `INSERT INTO purchases (supplierId, supplierName, total, date, invoiceNumber, status, estimatedDelivery) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [supplierId, supplierName, total, date, invoiceNumber, status, estimatedDelivery]
        );
        const purchaseId = purchaseRes.rows[0].id;

        for (const item of items) {
            await client.query(
                "INSERT INTO purchase_items (purchaseId, productId, productName, quantity, cost) VALUES ($1, $2, $3, $4, $5)",
                [purchaseId, item.productId, item.productName, item.quantity, item.cost]
            );
        }

        await client.query('COMMIT');
        res.json({ id: purchaseId, message: "Purchase recorded" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/purchases/:id/status', async (req, res) => {
    const { status } = req.body;
    const purchaseId = req.params.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get current status
        const currentRes = await client.query("SELECT status FROM purchases WHERE id = $1", [purchaseId]);
        const currentStatus = currentRes.rows[0]?.status;

        // Update status
        const result = await client.query(
            "UPDATE purchases SET status = $1 WHERE id = $2 RETURNING *",
            [status, purchaseId]
        );

        const stockUpdates = []; // Track stock changes for WebSocket

        // Logic: If moving TO 'Confirmed' (or 'Received') FROM something else -> Increase Stock
        // If moving FROM 'Confirmed' TO 'Cancelled' -> Decrease Stock (Revert)

        if (status === 'Confirmed' && currentStatus !== 'Confirmed') {
            const itemsRes = await client.query("SELECT * FROM purchase_items WHERE purchaseId = $1", [purchaseId]);
            for (const item of itemsRes.rows) {
                // Get current stock before update
                const pRes = await client.query("SELECT stock FROM products WHERE id = $1", [item.productid]);
                const currentStock = pRes.rows[0].stock;

                await client.query(
                    "UPDATE products SET stock = stock + $1 WHERE id = $2",
                    [item.quantity, item.productid]
                );

                // INV-02: Record Movement (Kardex)
                await client.query(
                    `INSERT INTO inventory_movements (productId, type, quantity, previousStock, newStock, reference, timestamp)
                     VALUES ($1, 'PURCHASE_CONFIRM', $2, $3, $4, $5, NOW())`,
                    [item.productid, item.quantity, currentStock, currentStock + item.quantity, `Purchase #${purchaseId}`]
                );
                
                // Get updated stock
                const productRes = await client.query("SELECT name, stock FROM products WHERE id = $1", [item.productid]);
                if (productRes.rows.length > 0) {
                    const product = productRes.rows[0];
                    stockCache.set(item.productid, { name: product.name, stock: product.stock });
                    stockUpdates.push({ 
                        productId: item.productid, 
                        productName: product.name, 
                        stock: product.stock,
                        quantityAdded: item.quantity
                    });
                }
            }
        } else if (status === 'Cancelled' && currentStatus === 'Confirmed') {
            const itemsRes = await client.query("SELECT * FROM purchase_items WHERE purchaseId = $1", [purchaseId]);
            for (const item of itemsRes.rows) {
                // Get current stock before update
                const pRes = await client.query("SELECT stock FROM products WHERE id = $1", [item.productid]);
                const currentStock = pRes.rows[0].stock;

                await client.query(
                    "UPDATE products SET stock = stock - $1 WHERE id = $2",
                    [item.quantity, item.productid]
                );
                
                // Get updated stock
                const productRes = await client.query("SELECT name, stock FROM products WHERE id = $1", [item.productid]);
                if (productRes.rows.length > 0) {
                    const product = productRes.rows[0];
                    stockCache.set(item.productid, { name: product.name, stock: product.stock });
                    stockUpdates.push({ 
                        productId: item.productid, 
                        productName: product.name, 
                        stock: product.stock,
                        quantityRemoved: item.quantity
                    });
                }

                // INV-02: Record Movement (Kardex)
                await client.query(
                    `INSERT INTO inventory_movements (productId, type, quantity, previousStock, newStock, reference, timestamp)
                     VALUES ($1, 'PURCHASE_CANCEL', $2, $3, $4, $5, NOW())`,
                    [item.productid, -item.quantity, currentStock, currentStock - item.quantity, `Purchase #${purchaseId}`]
                );
            }
        }

        await client.query('COMMIT');
        
        // Emit stock updates to all connected clients AFTER successful commit
        stockUpdates.forEach(update => {
            io.emit('stockUpdate', { ...update, action: 'purchase' });
        });
        
        if (stockUpdates.length > 0) {
            console.log(`Purchase #${purchaseId} status changed. Stock updates broadcasted to clients.`);
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.get('/api/supplier-products', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT sp.*, p.name as productName, p.category, s.name as supplierName 
             FROM supplier_products sp 
             JOIN products p ON sp.productId = p.id 
             JOIN suppliers s ON sp.supplierId = s.id`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/supplier-products/:supplierId', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT sp.*, p.name as productName, p.category 
             FROM supplier_products sp 
             JOIN products p ON sp.productId = p.id 
             WHERE sp.supplierId = $1`,
            [req.params.supplierId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CRM (Claims & Surveys) ---
app.get('/api/claims', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM claims ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/claims', async (req, res) => {
    const { customerId, type, product, reason } = req.body;
    const date = new Date().toISOString().slice(0, 10);
    try {
        const result = await pool.query(
            "INSERT INTO claims (customerId, type, product, reason, status, date) VALUES ($1, $2, $3, $4, 'Abierto', $5) RETURNING *",
            [customerId, type, product, reason, date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/surveys', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM surveys ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/surveys', async (req, res) => {
    const { customerId, rating, comment } = req.body;
    const date = new Date().toISOString().slice(0, 10);
    try {
        const result = await pool.query(
            "INSERT INTO surveys (customerId, rating, comment, date) VALUES ($1, $2, $3, $4) RETURNING *",
            [customerId, rating, comment, date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server ready for real-time stock updates`);
});

// Keep process alive hack
setInterval(() => { }, 10000);
