import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool, { initDB } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;
const SERVICE_NAME = process.env.SERVICE_NAME || 'pos-service';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';
const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL || 'http://localhost:3002';

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

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

await initDB();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔌 [${SERVICE_NAME}] Client connected:`, socket.id);
    
    socket.on('disconnect', () => {
        console.log(`🔌 [${SERVICE_NAME}] Client disconnected:`, socket.id);
    });
});

app.get('/health', (req, res) => {
    res.json({ service: SERVICE_NAME, status: 'OK', timestamp: new Date().toISOString() });
});

// ============ SALES ============

app.get('/api/sales', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM sales ORDER BY date DESC LIMIT 100");
        const sales = result.rows.map(s => ({
            ...s,
            total: parseFloat(s.total),
            items: parseInt(s.items)
        }));
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/sales/:id', async (req, res) => {
    try {
        const sale = await pool.query("SELECT * FROM sales WHERE id = $1", [req.params.id]);
        if (sale.rows.length === 0) {
            return res.status(404).json({ error: 'Sale not found' });
        }
        
        const items = await pool.query("SELECT * FROM sale_items WHERE saleId = $1", [req.params.id]);
        
        res.json({
            ...sale.rows[0],
            items: items.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/sales', async (req, res) => {
    console.log(`📥 [${SERVICE_NAME}] POST /api/sales - Request received`);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { total, items, paymentMethod, receiptType, receiptNumber, clientData, cartItems } = req.body;
    const date = new Date().toISOString();

    const clientName = clientData ? clientData.name : '';
    const clientDoc = clientData ? clientData.docNumber : '';
    const clientAddress = clientData ? clientData.address : '';

    console.log(`🔄 [${SERVICE_NAME}] Getting DB client...`);
    const client = await pool.connect();
    console.log(`✅ [${SERVICE_NAME}] DB client acquired`);

    try {
        console.log(`🔄 [${SERVICE_NAME}] Starting transaction...`);
        await client.query('BEGIN');

        // Insert Sale
        console.log(`🔄 [${SERVICE_NAME}] Inserting sale...`);
        const saleRes = await client.query(
            `INSERT INTO sales (date, total, items, paymentmethod, receipttype, receiptnumber, clientname, clientdoc, clientaddress) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [date, total, items, paymentMethod, receiptType, receiptNumber, clientName, clientDoc, clientAddress]
        );
        const saleId = saleRes.rows[0].id;
        console.log(`✅ [${SERVICE_NAME}] Sale inserted with ID: ${saleId}`);

        // Insert Sale Items
        console.log(`🔄 [${SERVICE_NAME}] Inserting ${cartItems.length} items...`);
        for (const item of cartItems) {
            console.log(`🔄 [${SERVICE_NAME}] Inserting item: ${item.name}`);
            await client.query(
                "INSERT INTO sale_items (saleid, productid, productname, quantity, price) VALUES ($1, $2, $3, $4, $5)",
                [saleId, item.id, item.name, item.quantity, item.price]
            );
            
            // Call Inventory Service to update stock
            console.log(`🔄 [${SERVICE_NAME}] Calling Inventory Service for product ${item.id}...`);
            try {
                await axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/update-stock`, {
                    productId: item.id,
                    quantity: -item.quantity,
                    type: 'SALE',
                    reference: `Sale #${saleId}`,
                    notes: `Venta realizada`
                });
                
                console.log(`✅ [${SERVICE_NAME}] Stock updated for product ${item.id}`);
            } catch (inventoryErr) {
                console.error(`❌ [${SERVICE_NAME}] Error updating inventory:`, inventoryErr.message);
                throw new Error(`Failed to update stock for ${item.name}`);
            }
        }
        
        console.log(`🔄 [${SERVICE_NAME}] Checking customer data...`);
        // If customer provided, update their points and purchases
        if (clientData && clientData.id) {
            try {
                const earnedPoints = Math.floor(total / 10); // 1 punto por cada 10 soles
                
                await axios.post(`${CRM_SERVICE_URL}/api/customers/${clientData.id}/purchase`, {
                    amount: total,
                    points: earnedPoints
                });
                
                console.log(`✅ [${SERVICE_NAME}] Customer points updated`);
            } catch (crmErr) {
                console.error(`❌ [${SERVICE_NAME}] Error updating customer:`, crmErr.message);
                // Continue even if CRM update fails
            }
        }

        console.log(`🔄 [${SERVICE_NAME}] Committing transaction...`);
        await client.query('COMMIT');
        console.log(`✅ [${SERVICE_NAME}] Transaction committed`);

        // Emit sale notification
        io.emit('saleCompleted', {
            saleId,
            total,
            items,
            paymentMethod,
            timestamp: date
        });
        console.log(`📢 [${SERVICE_NAME}] Sale notification emitted`);
        
        // Save notification to database
        await saveNotification(
            'success',
            'sale',
            'Venta completada',
            `Venta por $${total.toFixed(2)} - ${items.length} producto(s)`,
            { saleId, total, itemCount: items.length, paymentMethod }
        );

        res.status(201).json({
            success: true,
            saleId,
            message: 'Sale created successfully'
        });

    } catch (err) {
        console.log(`❌ [${SERVICE_NAME}] Error caught, rolling back...`);
        await client.query('ROLLBACK');
        console.error(`❌ [${SERVICE_NAME}] Error creating sale:`, err);
        res.status(500).json({ error: err.message });
    } finally {
        console.log(`🔄 [${SERVICE_NAME}] Releasing client...`);
        client.release();
        console.log(`✅ [${SERVICE_NAME}] Client released`);
    }
});

// Sales by date range
app.get('/api/sales/range/:start/:end', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM sales WHERE date BETWEEN $1 AND $2 ORDER BY date DESC",
            [req.params.start, req.params.end]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Total sales
app.get('/api/sales/stats/total', async (req, res) => {
    try {
        const result = await pool.query("SELECT SUM(total) as total, COUNT(*) as count FROM sales");
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

httpServer.listen(PORT, () => {
    console.log(`🚀 [${SERVICE_NAME}] Running on port ${PORT}`);
    console.log(`🔌 [${SERVICE_NAME}] WebSocket server ready`);
    console.log(`🔗 Inventory Service: ${INVENTORY_SERVICE_URL}`);
    console.log(`🔗 CRM Service: ${CRM_SERVICE_URL}`);
});
