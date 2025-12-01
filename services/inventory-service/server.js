import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool, { initDB } from './database.js';
import axios from 'axios';
import NodeCache from 'node-cache';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || 'inventory-service';
const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL || 'http://localhost:3002';

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

// Helper function to save notification to CRM
async function saveNotification(type, category, title, message, metadata = null) {
    try {
        await axios.post(`${CRM_SERVICE_URL}/api/notifications`, {
            type,
            category,
            title,
            message,
            metadata
        });
    } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error saving notification:`, err.message);
    }
}

// Stock cache with node-cache (Cache-Aside pattern with TTL)
const stockCache = new NodeCache({
    stdTTL: 600,           // 10 minutos de TTL por defecto
    checkperiod: 120,      // Revisa cada 2 minutos para limpiar expirados
    useClones: false,      // No clonar objetos (mejor performance)
    deleteOnExpire: true   // Eliminar cuando expire
});

// Log cache events
stockCache.on('set', (key, value) => {
    console.log(`📦 [Cache] SET: Product ${key}`);
});

stockCache.on('expired', (key, value) => {
    console.log(`⏰ [Cache] EXPIRED: Product ${key}`);
});

stockCache.on('del', (key) => {
    console.log(`🗑️ [Cache] DEL: Product ${key}`);
});

// Function to refresh stock cache
async function refreshStockCache() {
    try {
        const result = await pool.query("SELECT id, name, stock FROM products");
        result.rows.forEach(product => {
            stockCache.set(product.id.toString(), { name: product.name, stock: product.stock });
        });
        
        const stats = stockCache.getStats();
        console.log(`📦 [${SERVICE_NAME}] Stock cache refreshed: ${stats.keys} products`);
        console.log(`📊 [Cache Stats] Hits: ${stats.hits}, Misses: ${stats.misses}, Keys: ${stats.keys}`);
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
        const stats = stockCache.getStats();
        console.log(`📦 Cache initialized with ${stats.keys} products`);
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

// Cache Stats Endpoint
app.get('/api/cache/stats', (req, res) => {
    const stats = stockCache.getStats();
    const keys = stockCache.keys();
    
    res.json({
        stats: {
            keys: stats.keys,
            hits: stats.hits,
            misses: stats.misses,
            ksize: stats.ksize,
            vsize: stats.vsize
        },
        performance: {
            hitRate: stats.hits + stats.misses > 0 
                ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
                : '0%',
            totalRequests: stats.hits + stats.misses
        },
        cachedProducts: keys.length,
        sampleKeys: keys.slice(0, 10) // Primeros 10 productos en cache
    });
});

// Get all products (with cache)
app.get('/api/products', async (req, res) => {
    try {
        const CACHE_KEY = 'all_products';
        
        // Check cache first
        const cachedProducts = stockCache.get(CACHE_KEY);
        
        if (cachedProducts) {
            console.log(`📦 [Cache HIT] Lista completa de productos (${cachedProducts.length} productos)`);
            return res.json(cachedProducts);
        }
        
        // Cache miss - fetch from database
        console.log(`📢 [Cache MISS] Lista de productos - consultando DB`);
        const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
        
        // Convert numeric strings to numbers for frontend compatibility
        const products = result.rows.map(p => ({
            ...p,
            price: parseFloat(p.price),
            cost: parseFloat(p.cost),
            stock: parseInt(p.stock),
            minstock: parseInt(p.minstock)
        }));
        
        // Store in cache
        stockCache.set(CACHE_KEY, products);
        console.log(`💾 [Cache] Guardada lista completa (${products.length} productos)`);
        
        res.json(products);
    } catch (error) {
        console.error(`❌ [${SERVICE_NAME}] Error fetching products:`, error);
        res.status(500).json({ error: 'Error fetching products' });
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

// Fast stock check using cache (Cache-Aside pattern)
app.get('/api/products/stock/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Try to get from cache first (READ)
        const cached = stockCache.get(productId);
        if (cached !== undefined) {
            console.log(`📦 [Cache HIT] Product ${productId}`);
            return res.json(cached);
        }
        
        // Cache MISS - Read from database
        console.log(`💾 [Cache MISS] Product ${productId} - Reading from DB`);
        const result = await pool.query("SELECT id, name, stock FROM products WHERE id = $1", [productId]);
        
        if (result.rows.length > 0) {
            const product = result.rows[0];
            const data = { name: product.name, stock: product.stock };
            
            // Update cache (WRITE)
            stockCache.set(productId, data);
            res.json(data);
        } else {
            res.status(404).json({ error: "Product not found" });
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
            "INSERT INTO products (name, price, cost, stock, minstock, category, image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [name, price, cost, stock, minStock, category, image]
        );
        
        const newProduct = result.rows[0];
        
        // Update cache (WRITE)
        stockCache.set(newProduct.id.toString(), { name: newProduct.name, stock: newProduct.stock });
        // Invalidate list cache
        stockCache.del('all_products');
        console.log(`🗑️ [Cache] Invalidada lista de productos (producto ${newProduct.id} creado)`);
        
        // Record movement
        await pool.query(
            `INSERT INTO inventory_movements (productid, type, quantity, previousstock, newstock, reference, notes)
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
        
        // Save notification to database
        await saveNotification(
            'success',
            'stock',
            'Producto creado',
            `Nuevo producto: ${newProduct.name} - Stock inicial: ${newProduct.stock}`,
            { productId: newProduct.id, productName: newProduct.name, stock: newProduct.stock }
        );
        
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
             SET name = $1, price = $2, cost = $3, stock = $4, minstock = $5, category = $6, image = $7, updatedat = CURRENT_TIMESTAMP
             WHERE id = $8 RETURNING *`,
            [name, price, cost, stock, minStock, category, image, req.params.id]
        );
        
        const updatedProduct = result.rows[0];
        
        // Update cache (WRITE)
        stockCache.set(updatedProduct.id.toString(), { name: updatedProduct.name, stock: updatedProduct.stock });
        // Invalidate list cache
        stockCache.del('all_products');
        console.log(`🗑️ [Cache] Invalidada lista de productos (producto ${updatedProduct.id} actualizado)`);
        
        // Record movement if stock changed
        if (previousStock !== stock) {
            await pool.query(
                `INSERT INTO inventory_movements (productid, type, quantity, previousstock, newstock, reference, notes)
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
        
        // Save notification if stock changed
        if (previousStock !== stock) {
            const notifType = stock < updatedProduct.minstock ? 'warning' : 'info';
            await saveNotification(
                notifType,
                'stock',
                'Stock actualizado',
                `${updatedProduct.name} - Stock: ${stock}`,
                { productId: updatedProduct.id, productName: updatedProduct.name, stock, previousStock }
            );
        }
        
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
        // Invalidate cache (DELETE)
        stockCache.del(req.params.id);
        // Invalidate list cache
        stockCache.del('all_products');
        console.log(`🗑️ [Cache] Invalidada lista de productos (producto ${req.params.id} eliminado)`);
        
        res.json({ message: 'Product deleted', product: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get stock alerts (low stock products)
app.get('/api/alerts', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products WHERE stock <= minstock ORDER BY stock ASC");
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
            SELECT im.*, p.name as productname 
            FROM inventory_movements im
            JOIN products p ON im.productid = p.id
        `;
        let params = [];
        
        if (productId) {
            query += ' WHERE im.productid = $1';
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
        await client.query("UPDATE products SET stock = $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2", [newStock, productId]);
        
        // Record movement
        await client.query(
            `INSERT INTO inventory_movements (productid, type, quantity, previousstock, newstock, reference, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [productId, type, quantity, previousStock, newStock, reference, notes]
        );
        
        await client.query('COMMIT');
        
        // Update cache
        // Update cache (WRITE)
        stockCache.set(productId.toString(), { name: current.rows[0].name, stock: newStock });
        // Invalidate list cache
        stockCache.del('all_products');
        console.log(`🗑️ [Cache] Invalidada lista de productos (stock producto ${productId} actualizado)`);
        
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
