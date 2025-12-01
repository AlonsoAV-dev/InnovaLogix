import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool, { initDB } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const SERVICE_NAME = process.env.SERVICE_NAME || 'crm-service';

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

await initDB();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔌 [${SERVICE_NAME}] Client connected:`, socket.id);
    
    socket.on('disconnect', () => {
        console.log(`🔌 [${SERVICE_NAME}] Client disconnected:`, socket.id);
    });
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: SERVICE_NAME, status: 'OK', timestamp: new Date().toISOString() });
});

// ============ CUSTOMERS ============

app.get('/api/customers', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM customers ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/customers/:id', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM customers WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/customers', async (req, res) => {
    const { name, email, phone, type } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO customers (name, email, phone, type, points, totalPurchases, lastVisit) VALUES ($1, $2, $3, $4, 0, 0, CURRENT_TIMESTAMP) RETURNING *",
            [name, email, phone, type || 'Nuevo']
        );
        
        // Emit new customer notification
        io.emit('newCustomer', {
            customerId: result.rows[0].id,
            customerName: name,
            email
        });
        console.log(`📢 [${SERVICE_NAME}] New customer notification emitted`);
        
        // Save notification to database
        await pool.query(
            `INSERT INTO notifications (type, category, title, message, metadata, read, createdAt) 
             VALUES ($1, $2, $3, $4, $5, FALSE, CURRENT_TIMESTAMP)`,
            ['info', 'customer', 'Nuevo cliente', `Cliente registrado: ${name}`, JSON.stringify({ customerId: result.rows[0].id, customerName: name, email })]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    const { name, email, phone, type, points, totalPurchases } = req.body;
    try {
        const result = await pool.query(
            `UPDATE customers SET name = $1, email = $2, phone = $3, type = $4, points = $5, totalPurchases = $6, updatedAt = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *`,
            [name, email, phone, type, points, totalPurchases, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM customers WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json({ message: 'Customer deleted', customer: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update customer points and purchases (called from POS service)
app.post('/api/customers/:id/purchase', async (req, res) => {
    const { amount, points } = req.body;
    try {
        const result = await pool.query(
            `UPDATE customers 
             SET totalPurchases = totalPurchases + $1, 
                 points = points + $2, 
                 lastVisit = CURRENT_TIMESTAMP,
                 updatedAt = CURRENT_TIMESTAMP
             WHERE id = $3 RETURNING *`,
            [amount, points, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ CLAIMS ============

app.get('/api/claims', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, cu.name as customerName 
            FROM claims c 
            LEFT JOIN customers cu ON c.customerId = cu.id 
            ORDER BY c.date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/claims', async (req, res) => {
    const { customerId, type, product, reason, status } = req.body;
    try {
        // Get customer name
        const customer = await pool.query("SELECT name FROM customers WHERE id = $1", [customerId]);
        const customerName = customer.rows[0]?.name || 'Cliente';
        
        const result = await pool.query(
            "INSERT INTO claims (customerId, type, product, reason, status, date) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *",
            [customerId, type, product, reason, status || 'Pendiente']
        );
        
        // Emit new claim notification
        io.emit('newClaim', {
            claimId: result.rows[0].id,
            customerName,
            type,
            product,
            status: status || 'Pendiente'
        });
        console.log(`📢 [${SERVICE_NAME}] New claim notification emitted`);
        
        // Save notification to database
        await pool.query(
            `INSERT INTO notifications (type, category, title, message, metadata, read, createdAt) 
             VALUES ($1, $2, $3, $4, $5, FALSE, CURRENT_TIMESTAMP)`,
            ['warning', 'claim', 'Nuevo reclamo', `Reclamo de ${customerName}: ${type}`, JSON.stringify({ claimId: result.rows[0].id, customerName, type, product })]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/claims/:id', async (req, res) => {
    const { status, resolution } = req.body;
    try {
        const result = await pool.query(
            `UPDATE claims SET status = $1, resolution = $2, resolvedAt = CASE WHEN $1 = 'Resuelto' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = $3 RETURNING *`,
            [status, resolution, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Claim not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ SURVEYS ============

app.get('/api/surveys', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, c.name as customerName 
            FROM surveys s 
            LEFT JOIN customers c ON s.customerId = c.id 
            ORDER BY s.date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/surveys', async (req, res) => {
    const { customerId, rating, comment } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO surveys (customerId, rating, comment, date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *",
            [customerId, rating, comment]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get customer satisfaction average
app.get('/api/surveys/average', async (req, res) => {
    try {
        const result = await pool.query("SELECT AVG(rating)::numeric(10,2) as average FROM surveys");
        res.json({ average: parseFloat(result.rows[0].average) || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ LOYALTY PROGRAM ============

app.get('/api/loyalty/top-customers', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM customers ORDER BY points DESC LIMIT 10");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ NOTIFICATIONS ============

// Get all notifications (optionally filter by read status)
app.get('/api/notifications', async (req, res) => {
    try {
        const { read, limit = 50 } = req.query;
        let query = "SELECT * FROM notifications";
        let params = [];
        
        if (read !== undefined) {
            query += " WHERE read = $1";
            params.push(read === 'true');
        }
        
        query += " ORDER BY createdAt DESC LIMIT $" + (params.length + 1);
        params.push(parseInt(limit));
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create notification
app.post('/api/notifications', async (req, res) => {
    const { type, category, title, message, metadata } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO notifications (type, category, title, message, metadata, read, createdAt) 
             VALUES ($1, $2, $3, $4, $5, FALSE, CURRENT_TIMESTAMP) RETURNING *`,
            [type, category, title, message, metadata ? JSON.stringify(metadata) : null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *",
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark all notifications as read
app.patch('/api/notifications/read-all', async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE notifications SET read = TRUE WHERE read = FALSE RETURNING COUNT(*)"
        );
        res.json({ message: 'All notifications marked as read', count: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete old notifications (older than 30 days)
app.delete('/api/notifications/cleanup', async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM notifications WHERE createdAt < NOW() - INTERVAL '30 days' RETURNING COUNT(*)"
        );
        res.json({ message: 'Old notifications deleted', count: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

httpServer.listen(PORT, () => {
    console.log(`🚀 [${SERVICE_NAME}] Running on port ${PORT}`);
    console.log(`🔌 [${SERVICE_NAME}] WebSocket server ready`);
});
