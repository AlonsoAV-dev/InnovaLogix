import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import pool, { initDB } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const SERVICE_NAME = process.env.SERVICE_NAME || 'purchases-service';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';

app.use(cors());
app.use(express.json());

await initDB();

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: SERVICE_NAME, status: 'OK', timestamp: new Date().toISOString() });
});

// ============ SUPPLIERS ============

app.get('/api/suppliers', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM suppliers ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/suppliers/:id', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM suppliers WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json(result.rows[0]);
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
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/suppliers/:id', async (req, res) => {
    const { name, ruc, contact, phone, email } = req.body;
    try {
        const result = await pool.query(
            `UPDATE suppliers SET name = $1, ruc = $2, contact = $3, phone = $4, email = $5, updatedAt = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
            [name, ruc, contact, phone, email, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM suppliers WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json({ message: 'Supplier deleted', supplier: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ PURCHASES ============

app.get('/api/purchases', async (req, res) => {
    try {
        const purchases = await pool.query("SELECT * FROM purchases ORDER BY date DESC");
        
        // Get items for each purchase
        const purchasesWithItems = await Promise.all(
            purchases.rows.map(async (purchase) => {
                const items = await pool.query(
                    "SELECT * FROM purchase_items WHERE purchaseid = $1",
                    [purchase.id]
                );
                return {
                    ...purchase,
                    total: parseFloat(purchase.total),
                    items: items.rows.map(item => ({
                        ...item,
                        quantity: parseInt(item.quantity),
                        cost: parseFloat(item.cost)
                    }))
                };
            })
        );
        
        res.json(purchasesWithItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/purchases/:id', async (req, res) => {
    try {
        const purchase = await pool.query("SELECT * FROM purchases WHERE id = $1", [req.params.id]);
        if (purchase.rows.length === 0) {
            return res.status(404).json({ error: 'Purchase not found' });
        }
        
        const items = await pool.query("SELECT * FROM purchase_items WHERE purchaseId = $1", [req.params.id]);
        
        res.json({
            ...purchase.rows[0],
            items: items.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/purchases', async (req, res) => {
    const { supplierId, supplierName, items, invoiceNumber, estimatedDelivery } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const total = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
        
        const purchaseRes = await client.query(
            `INSERT INTO purchases (supplierid, suppliername, total, invoicenumber, status, estimateddelivery) 
             VALUES ($1, $2, $3, $4, 'Pending', $5) RETURNING *`,
            [supplierId, supplierName, total, invoiceNumber, estimatedDelivery]
        );
        
        const purchaseId = purchaseRes.rows[0].id;
        
        for (const item of items) {
            await client.query(
                "INSERT INTO purchase_items (purchaseid, productid, productname, quantity, cost) VALUES ($1, $2, $3, $4, $5)",
                [purchaseId, item.productId, item.productName, item.quantity, item.cost]
            );
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({
            ...purchaseRes.rows[0],
            items
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ [${SERVICE_NAME}] Error creating purchase:`, err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Confirm purchase (updates inventory via inter-service call)
app.put('/api/purchases/:id/status', async (req, res) => {
    const { status } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const purchase = await client.query("SELECT * FROM purchases WHERE id = $1", [req.params.id]);
        if (purchase.rows.length === 0) {
            throw new Error('Purchase not found');
        }
        
        await client.query(
            "UPDATE purchases SET status = $1 WHERE id = $2",
            [status, req.params.id]
        );
        
        // If confirmed, update inventory
        if (status === 'Confirmed') {
            const items = await client.query("SELECT * FROM purchase_items WHERE purchaseid = $1", [req.params.id]);
            
            for (const item of items.rows) {
                try {
                    // Call Inventory Service to update stock
                    await axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/update-stock`, {
                        productId: item.productid,
                        quantity: item.quantity,
                        type: 'PURCHASE',
                        reference: `Purchase #${req.params.id}`,
                        notes: `Compra confirmada del proveedor`
                    });
                    
                    console.log(`✅ [${SERVICE_NAME}] Stock updated for product ${item.productid}`);
                } catch (inventoryErr) {
                    console.error(`❌ [${SERVICE_NAME}] Error updating inventory:`, inventoryErr.message);
                    // Continue with other items even if one fails
                }
            }
        }
        
        await client.query('COMMIT');
        
        res.json({ message: 'Purchase status updated', status });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ [${SERVICE_NAME}] Error updating purchase:`, err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ============ SUPPLIER PRODUCTS (Catalog) ============

// Get all supplier products
app.get('/api/supplier-products', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sp.*, s.name as suppliername 
            FROM supplier_products sp
            JOIN suppliers s ON sp.supplierid = s.id
            ORDER BY sp.productname, sp.price ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get products for a specific supplier
app.get('/api/supplier-products/:supplierId', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sp.*, s.name as suppliername 
            FROM supplier_products sp
            JOIN suppliers s ON sp.supplierid = s.id
            WHERE sp.supplierid = $1
            ORDER BY sp.productname ASC
        `, [req.params.supplierId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add product to supplier catalog
app.post('/api/supplier-products', async (req, res) => {
    const { supplierId, productId, productName, price, stock } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO supplier_products (supplierid, productid, productname, price, stock) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [supplierId, productId, productName, price, stock]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update supplier product
app.put('/api/supplier-products/:id', async (req, res) => {
    const { price, stock } = req.body;
    try {
        const result = await pool.query(
            `UPDATE supplier_products SET price = $1, stock = $2, updatedat = CURRENT_TIMESTAMP 
             WHERE id = $3 RETURNING *`,
            [price, stock, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Supplier product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ PRICE COMPARISON ============

app.get('/api/price-comparison/:productId', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sp.*, s.name as supplierName 
            FROM supplier_products sp
            JOIN suppliers s ON sp.supplierid = s.id
            WHERE sp.productid = $1
            ORDER BY sp.price ASC
        `, [req.params.productId]);
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/price-comparison', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sp.*, s.name as supplierName 
            FROM supplier_products sp
            JOIN suppliers s ON sp.supplierid = s.id
            ORDER BY sp.productid, sp.price ASC
        `);
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 [${SERVICE_NAME}] Running on port ${PORT}`);
    console.log(`🔗 Connected to Inventory Service: ${INVENTORY_SERVICE_URL}`);
});
