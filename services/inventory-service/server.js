import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool, { initDB } from './database.js';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || 'inventory-service';

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Stock cache for faster reads (CQRS pattern)
const stockCache = new Map();

// Function to refresh stock cache
async function refreshStockCache() {
    try {
        const result = await pool.query("SELECT id, name, stock FROM products");
        result.rows.forEach(product => {
            stockCache.set(product.id, { name: product.name, stock: product.stock });
        });
        console.log(`📦 [${SERVICE_NAME}] Stock cache refreshed: ${stockCache.size} products`);
    } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error refreshing stock cache:`, err);
    }
}

// Async initialization function
async function initialize() {
    await initDB();
    await refreshStockCache();
    
    // Start server only after initialization is complete
    httpServer.listen(PORT, () => {
        console.log(`🚀 [${SERVICE_NAME}] Running on port ${PORT}`);
        console.log(`📦 Cache initialized with ${stockCache.size} products`);
    });
}

// Initialize and start server
initialize().catch(err => {
    console.error(`❌ [${SERVICE_NAME}] Initialization error:`, err);
    process.exit(1);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔌 [${SERVICE_NAME}] Client connected:`, socket.id);
    
    socket.on('disconnect', () => {
        console.log(`🔌 [${SERVICE_NAME}] Client disconnected:`, socket.id);
    });
});

// ============ ENDPOINTS ============

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        service: SERVICE_NAME, 
        status: 'OK', 
        timestamp: new Date().toISOString() 
    });
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
        // Convert numeric strings to numbers for frontend compatibility
        const products = result.rows.map(p => ({
            ...p,
            price: parseFloat(p.price),
            cost: parseFloat(p.cost),
            stock: parseInt(p.stock),
            minstock: parseInt(p.minstock)
        }));
        res.json(products);
    } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error in GET /api/products:`, err);
        res.status(500).json({ error: err.message });
    }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const product = result.rows[0];
        res.json({
            ...product,
            price: parseFloat(product.price),
            cost: parseFloat(product.cost),
            stock: parseInt(product.stock),
            minstock: parseInt(product.minstock)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fast stock check using cache
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

// Create product
app.post('/api/products', async (req, res) => {
    const { name, price, cost, stock, minStock, category, image } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO products (name, price, cost, stock, minStock, category, image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [name, price, cost, stock, minStock, category, image]
        );
        
        const newProduct = result.rows[0];
        
        // Update cache
        stockCache.set(newProduct.id, { name: newProduct.name, stock: newProduct.stock });
        
        // Record movement
        await pool.query(
            `INSERT INTO inventory_movements (productId, type, quantity, previousStock, newStock, reference, notes)
             VALUES ($1, 'ADJUSTMENT', $2, 0, $3, 'CREATE', 'Producto creado')`,
            [newProduct.id, stock, stock]
        );
        
        // Notify clients via WebSocket
        io.emit('stockUpdate', { 
            productId: newProduct.id, 
            productName: newProduct.name, 
            stock: newProduct.stock,
            action: 'created'
        });
        
        res.status(201).json(newProduct);
    } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error creating product:`, err);
        res.status(500).json({ error: err.message });
    }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
    const { name, price, cost, stock, minStock, category, image } = req.body;
    try {
        // Get current stock for movement record
        const current = await pool.query("SELECT stock FROM products WHERE id = $1", [req.params.id]);
        if (current.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const previousStock = current.rows[0].stock;
        
        const result = await pool.query(
            `UPDATE products 
             SET name = $1, price = $2, cost = $3, stock = $4, minStock = $5, category = $6, image = $7, updatedAt = CURRENT_TIMESTAMP
             WHERE id = $8 RETURNING *`,
            [name, price, cost, stock, minStock, category, image, req.params.id]
        );
        
        const updatedProduct = result.rows[0];
        
        // Update cache
        stockCache.set(updatedProduct.id, { name: updatedProduct.name, stock: updatedProduct.stock });
        
        // Record movement if stock changed
        if (previousStock !== stock) {
            await pool.query(
                `INSERT INTO inventory_movements (productId, type, quantity, previousStock, newStock, reference, notes)
                 VALUES ($1, 'ADJUSTMENT', $2, $3, $4, 'UPDATE', 'Producto actualizado')`,
                [updatedProduct.id, stock - previousStock, previousStock, stock]
            );
        }
        
        // Notify clients
        io.emit('stockUpdate', { 
            productId: updatedProduct.id, 
            productName: updatedProduct.name, 
            stock: updatedProduct.stock,
            action: 'updated'
        });
        
        res.json(updatedProduct);
    } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error updating product:`, err);
        res.status(500).json({ error: err.message });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Remove from cache
        stockCache.delete(parseInt(req.params.id));
        
        res.json({ message: 'Product deleted', product: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get stock alerts (low stock products)
app.get('/api/alerts', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products WHERE stock <= minStock ORDER BY stock ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get inventory movements (Kardex)
app.get('/api/inventory/movements', async (req, res) => {
    try {
        const { productId } = req.query;
        let query = `
            SELECT im.*, p.name as productName 
            FROM inventory_movements im
            JOIN products p ON im.productId = p.id
        `;
        let params = [];
        
        if (productId) {
            query += ' WHERE im.productId = $1';
            params.push(productId);
        }
        
        query += ' ORDER BY im.timestamp DESC LIMIT 100';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update stock (called by other services)
app.post('/api/inventory/update-stock', async (req, res) => {
    const { productId, quantity, type, reference, notes } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Get current stock
        const current = await client.query("SELECT name, stock FROM products WHERE id = $1", [productId]);
        if (current.rows.length === 0) {
            throw new Error('Product not found');
        }
        
        const previousStock = current.rows[0].stock;
        const newStock = previousStock + quantity;
        
        if (newStock < 0) {
            throw new Error('Insufficient stock');
        }
        
        // Update stock
        await client.query("UPDATE products SET stock = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2", [newStock, productId]);
        
        // Record movement
        await client.query(
            `INSERT INTO inventory_movements (productId, type, quantity, previousStock, newStock, reference, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [productId, type, quantity, previousStock, newStock, reference, notes]
        );
        
        await client.query('COMMIT');
        
        // Update cache
        stockCache.set(productId, { name: current.rows[0].name, stock: newStock });
        
        // Notify clients
        io.emit('stockUpdate', { 
            productId, 
            productName: current.rows[0].name, 
            stock: newStock,
            action: type.toLowerCase()
        });
        
        res.json({ 
            success: true, 
            productId, 
            previousStock, 
            newStock 
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ [${SERVICE_NAME}] Error updating stock:`, err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});
