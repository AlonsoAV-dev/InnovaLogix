import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './database.js';
import cron from "node-cron";

// Import Commands
import { ProductCommands } from './commands/ProductCommands.js';
import { SaleCommands } from './commands/SaleCommands.js';
import { PurchaseCommands } from './commands/PurchaseCommands.js';

// Import Queries
import { ProductQueries } from './queries/ProductQueries.js';
import { SaleQueries } from './queries/SaleQueries.js';
import { PurchaseQueries } from './queries/PurchaseQueries.js';
import { SupplierQueries } from './queries/SupplierQueries.js';
import { CustomerQueries } from './queries/CustomerQueries.js';

const app = express();
const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Stock cache (mejorado para CQRS)
const stockCache = new Map();

async function refreshStockCache() {
    try {
        const products = await ProductQueries.getAllProducts();
        stockCache.clear();
        products.forEach(product => {
            stockCache.set(product.id, { name: product.name, stock: product.stock });
        });
        console.log(`✅ Stock cache refreshed with ${stockCache.size} products`);
    } catch (err) {
        console.error("Error refreshing stock cache:", err);
    }
}

refreshStockCache();

// Socket.IO
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.use(cors());
app.use(bodyParser.json());

// ========== QUERY ENDPOINTS (READ) ==========

// --- PRODUCT QUERIES ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await ProductQueries.getAllProducts();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await ProductQueries.getProductById(parseInt(req.params.id));
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products/stock/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (stockCache.has(productId)) {
            return res.json(stockCache.get(productId));
        }
        
        const product = await ProductQueries.getProductStock(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        
        const stockInfo = { name: product.name, stock: product.stock };
        stockCache.set(productId, stockInfo);
        res.json(stockInfo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- INVENTORY QUERIES ---
app.get('/api/inventory/kardex/:productId', async (req, res) => {
    try {
        const kardex = await ProductQueries.getInventoryKardex(req.params.productId);
        res.json(kardex);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/inventory/alerts', async (req, res) => {
    try {
        const alerts = await ProductQueries.getLowStockAlerts();
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SALES QUERIES ---
app.get('/api/sales', async (req, res) => {
    try {
        const sales = await SaleQueries.getAllSales();
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REPORT QUERIES ---
app.get('/api/reportes/ventas-diarias', async (req, res) => {
    try {
        const report = await SaleQueries.getDailySalesReport();
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reportes/top-productos', async (req, res) => {
    try {
        const report = await SaleQueries.getTopProductsReport();
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reportes/ventas-detalle', async (req, res) => {
    try {
        const report = await SaleQueries.getSalesDetailReport();
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SUPPLIER QUERIES ---
app.get('/api/suppliers', async (req, res) => {
    try {
        const suppliers = await SupplierQueries.getAllSuppliers();
        res.json(suppliers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/supplier-products', async (req, res) => {
    try {
        const supplierProducts = await SupplierQueries.getAllSupplierProducts();
        res.json(supplierProducts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/supplier-products/:supplierId', async (req, res) => {
    try {
        const products = await SupplierQueries.getSupplierProducts(req.params.supplierId);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PURCHASE QUERIES ---
app.get('/api/purchases', async (req, res) => {
    try {
        const purchases = await PurchaseQueries.getAllPurchases();
        res.json(purchases);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CUSTOMER QUERIES ---
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await CustomerQueries.getAllCustomers();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/claims', async (req, res) => {
    try {
        const claims = await CustomerQueries.getClaims();
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/surveys', async (req, res) => {
    try {
        const surveys = await CustomerQueries.getSurveys();
        res.json(surveys);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== COMMAND ENDPOINTS (WRITE) ==========

// --- PRODUCT COMMANDS ---
app.post('/api/products', async (req, res) => {
    try {
        const newProduct = await ProductCommands.createProduct(req.body);
        
        // Update cache
        stockCache.set(newProduct.id, { name: newProduct.name, stock: newProduct.stock });
        
        // Notify clients
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
    try {
        const updatedProduct = await ProductCommands.updateProduct(req.params.id, req.body);
        
        // Update cache
        stockCache.set(updatedProduct.id, { name: updatedProduct.name, stock: updatedProduct.stock });
        
        // Notify clients
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
        const result = await ProductCommands.deleteProduct(req.params.id);
        
        // Remove from cache
        const productId = parseInt(req.params.id);
        stockCache.delete(productId);
        
        // Notify clients
        io.emit('stockUpdate', { 
            productId: productId, 
            stock: 0,
            action: 'deleted'
        });
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SALE COMMANDS ---
app.post('/api/sales', async (req, res) => {
    try {
        const { saleId, stockUpdates } = await SaleCommands.createSale(req.body);
        
        // Update cache and notify clients
        stockUpdates.forEach(update => {
            stockCache.set(update.productId, { name: update.productName, stock: update.stock });
            io.emit('stockUpdate', { ...update, action: 'sale' });
        });
        
        console.log(`✅ Sale #${saleId} completed. Stock updates broadcasted.`);
        res.json({ id: saleId, message: "Sale recorded" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PURCHASE COMMANDS ---
app.post('/api/purchases', async (req, res) => {
    try {
        const result = await PurchaseCommands.createPurchase(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/purchases/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const purchaseId = req.params.id;
        
        // Get current status first
        const currentPurchase = await PurchaseQueries.getPurchaseById(purchaseId);
        const currentStatus = currentPurchase?.status;
        
        const { purchase, stockUpdates } = await PurchaseCommands.updatePurchaseStatus(
            purchaseId, status, currentStatus
        );
        
        // Update cache and notify clients
        if (stockUpdates && stockUpdates.length > 0) {
            stockUpdates.forEach(update => {
                stockCache.set(update.productId, { name: update.productName, stock: update.stock });
                io.emit('stockUpdate', { ...update, action: 'purchase' });
            });
            console.log(`✅ Purchase #${purchaseId} status updated. Stock changes broadcasted.`);
        }
        
        res.json(purchase);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SUPPLIER COMMANDS ---
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

// --- CRM COMMANDS ---
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

// Cron job for refreshing materialized views
cron.schedule("*/1 * * * *", async () => {
    try {
        console.log("🔄 Refreshing Materialized Views...");
        await pool.query("REFRESH MATERIALIZED VIEW CONCURRENTLY ventas_diarias_mv");
        await pool.query("REFRESH MATERIALIZED VIEW CONCURRENTLY top_productos_mv");
        await pool.query("REFRESH MATERIALIZED VIEW CONCURRENTLY ventas_detalle_mv");
        console.log("✅ Views refreshed!");
    } catch (err) {
        console.error("❌ Error refreshing MVs:", err.message);
    }
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 CQRS Pattern implemented: Commands (Write) & Queries (Read) separated`);
    console.log(`🔔 WebSocket server ready for real-time updates`);
});

// Keep process alive
setInterval(() => {}, 10000);