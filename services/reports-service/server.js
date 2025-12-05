import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './database.js';
import PDFDocument from 'pdfkit';
import { auditService } from './src/services/auditService.js';
import { cacheService } from './src/services/cacheService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const SERVICE_NAME = process.env.SERVICE_NAME || 'reports-service';

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: SERVICE_NAME, status: 'OK', timestamp: new Date().toISOString() });
});

// ============ AUDIT LOGS (ESC-20) ============

app.get('/api/audit-logs', async (req, res) => {
    try {
        const logs = await auditService.getLogs();
        const integrity = await auditService.verifyIntegrity();
        res.json({
            integrity,
            logs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ DASHBOARD ============

app.get('/api/dashboard', cacheService.middleware(60), async (req, res) => {
    try {
        const [productsRes, salesRes, customersRes, alertsRes] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM products'),
            pool.query('SELECT SUM(total) as total FROM sales'),
            pool.query('SELECT COUNT(*) as count FROM customers'),
            pool.query('SELECT COUNT(*) as count FROM products WHERE stock <= minstock')
        ]);

        const totalProducts = parseInt(productsRes.rows[0].count);
        const totalSales = parseFloat(salesRes.rows[0].total || 0);
        const totalCustomers = parseInt(customersRes.rows[0].count);
        const lowStockAlerts = parseInt(alertsRes.rows[0].count);

        // Get recent sales
        const recentSalesRes = await pool.query('SELECT * FROM sales ORDER BY date DESC LIMIT 5');

        // Get top products (by stock for now as a proxy for "top" in dashboard view, or could be random)
        const topProductsRes = await pool.query('SELECT * FROM products ORDER BY price DESC LIMIT 5');

        res.json({
            totalProducts,
            totalSales: totalSales.toFixed(2),
            totalCustomers,
            lowStockAlerts,
            recentSales: recentSalesRes.rows,
            topProducts: topProductsRes.rows
        });
    } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Dashboard error:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// ============ SALES REPORTS ============

app.get('/api/reports/sales', cacheService.middleware(300), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                DATE(date) as date, 
                SUM(total) as total, 
                COUNT(*) as count 
            FROM sales 
            GROUP BY DATE(date) 
            ORDER BY date DESC
        `);

        res.json(result.rows.map(row => ({
            date: row.date.toISOString().split('T')[0],
            total: parseFloat(row.total),
            count: parseInt(row.count)
        })));
    } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Sales report error:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// Sales by payment method
app.get('/api/reports/sales/payment-methods', cacheService.middleware(300), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                paymentmethod as method, 
                SUM(total) as total, 
                COUNT(*) as count 
            FROM sales 
            GROUP BY paymentmethod
        `);

        res.json(result.rows.map(row => ({
            method: row.method,
            total: parseFloat(row.total),
            count: parseInt(row.count)
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ INVENTORY REPORTS ============

app.get('/api/reports/inventory', cacheService.middleware(300), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                category, 
                COUNT(*) as products, 
                SUM(stock) as totalstock,
                SUM(stock * cost) as totalvalue
            FROM products 
            GROUP BY category
        `);

        const totalRes = await pool.query('SELECT COUNT(*) as count, SUM(stock * cost) as totalvalue FROM products');

        res.json({
            totalProducts: parseInt(totalRes.rows[0].count),
            totalValue: parseFloat(totalRes.rows[0].totalvalue || 0).toFixed(2),
            byCategory: result.rows.map(row => ({
                category: row.category,
                products: parseInt(row.products),
                totalStock: parseInt(row.totalstock),
                totalValue: parseFloat(row.totalvalue || 0).toFixed(2)
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ CRM REPORTS ============

app.get('/api/reports/customers', cacheService.middleware(300), async (req, res) => {
    try {
        const customersRes = await pool.query(`
            SELECT 
                type, 
                COUNT(*) as count, 
                SUM(totalpurchases) as totalpurchases 
            FROM customers 
            GROUP BY type
        `);

        const surveysRes = await pool.query('SELECT AVG(rating) as average FROM surveys');
        const totalRes = await pool.query('SELECT COUNT(*) as count FROM customers');

        res.json({
            totalCustomers: parseInt(totalRes.rows[0].count),
            byType: customersRes.rows.map(row => ({
                type: row.type,
                count: parseInt(row.count),
                totalPurchases: parseFloat(row.totalpurchases || 0)
            })),
            averageSatisfaction: parseFloat(surveysRes.rows[0].average || 0).toFixed(2)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ ANALYTICS ============

app.get('/api/analytics/trends', cacheService.middleware(300), async (req, res) => {
    try {
        // Last 7 days sales
        const result = await pool.query(`
            SELECT 
                DATE(date) as date, 
                SUM(total) as total, 
                COUNT(*) as count 
            FROM sales 
            WHERE date >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(date) 
            ORDER BY date ASC
        `);

        const alertsRes = await pool.query('SELECT COUNT(*) as count FROM products WHERE stock <= minstock');

        res.json({
            salesTrend: result.rows.map(row => ({
                date: row.date.toISOString().split('T')[0],
                total: parseFloat(row.total).toFixed(2),
                count: parseInt(row.count)
            })),
            lowStockProducts: parseInt(alertsRes.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ PRODUCT ANALYSIS ============

app.get('/api/reports/products/ranking', cacheService.middleware(300), async (req, res) => {
    try {
        // Ranking by revenue (using sale_items)
        const result = await pool.query(`
            SELECT 
                p.id, 
                p.name, 
                p.category, 
                SUM(si.quantity) as units, 
                SUM(si.quantity * si.price) as revenue,
                CASE WHEN p.price > 0 THEN ((p.price - p.cost) / p.price) * 100 ELSE 0 END as margin
            FROM sale_items si
            JOIN products p ON si.productid = p.id
            GROUP BY p.id, p.name, p.category, p.price, p.cost
            ORDER BY revenue DESC
        `);

        res.json(result.rows.map(row => ({
            id: row.id,
            name: row.name,
            category: row.category,
            units: parseInt(row.units),
            revenue: parseFloat(row.revenue).toFixed(2),
            margin: parseFloat(row.margin).toFixed(1)
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/products/rotation', cacheService.middleware(300), async (req, res) => {
    try {
        // Rotation based on movement quantity (SALE type)
        const result = await pool.query(`
            SELECT 
                p.id, 
                p.name, 
                COALESCE(SUM(ABS(im.quantity)), 0) as totalsold
            FROM products p
            LEFT JOIN inventory_movements im ON p.id = im.productid AND im.type = 'SALE'
            GROUP BY p.id, p.name
            ORDER BY totalsold DESC
        `);

        const rotation = result.rows.map(row => {
            const totalSold = parseInt(row.totalsold);
            let status = 'Baja';
            if (totalSold > 50) status = 'Alta';
            else if (totalSold > 20) status = 'Media';

            return {
                id: row.id,
                name: row.name,
                totalSold,
                status,
                rotationDays: totalSold > 0 ? Math.round(30 / totalSold * 10) / 10 : 0 // Est. days to sell one unit based on 30 days
            };
        });

        res.json(rotation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ INVENTORY MANAGEMENT REPORTS ============

app.get('/api/reports/inventory/critical', cacheService.middleware(60), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE stock <= minstock');

        res.json(result.rows.map(p => ({
            ...p,
            status: p.stock === 0 ? 'Agotado' : 'Crítico'
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/inventory/slow-rotation', cacheService.middleware(300), async (req, res) => {
    try {
        // Products with no sales in last 30 days
        const result = await pool.query(`
            SELECT p.* 
            FROM products p
            WHERE p.id NOT IN (
                SELECT DISTINCT productid 
                FROM inventory_movements 
                WHERE type = 'SALE' AND timestamp >= NOW() - INTERVAL '30 days'
            )
        `);

        res.json(result.rows.map(p => ({
            ...p,
            daysInactive: '> 30'
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ PURCHASE REPORTS ============

app.get('/api/reports/purchases/by-supplier', cacheService.middleware(300), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                suppliername as name, 
                SUM(total) as total, 
                COUNT(*) as count 
            FROM purchases 
            GROUP BY suppliername 
            ORDER BY total DESC
        `);

        res.json(result.rows.map(row => ({
            name: row.name,
            total: parseFloat(row.total),
            count: parseInt(row.count)
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/purchases/status', cacheService.middleware(300), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                status, 
                SUM(total) as total, 
                COUNT(*) as count 
            FROM purchases 
            GROUP BY status
        `);

        res.json(result.rows.map(row => ({
            status: row.status,
            total: parseFloat(row.total),
            count: parseInt(row.count)
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/purchases/monthly', cacheService.middleware(300), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                TO_CHAR(date, 'YYYY-MM') as month, 
                SUM(total) as total, 
                COUNT(*) as count 
            FROM purchases 
            GROUP BY TO_CHAR(date, 'YYYY-MM') 
            ORDER BY month ASC
        `);

        res.json(result.rows.map(row => ({
            month: row.month,
            total: parseFloat(row.total),
            count: parseInt(row.count)
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ FINANCIAL REPORTS ============

app.get('/api/reports/financial/net-profit', cacheService.middleware(300), async (req, res) => {
    try {
        // Calculate revenue and cost from sales and sale_items
        // This is an approximation. Ideally we would track cost at time of sale.
        const result = await pool.query(`
            SELECT 
                TO_CHAR(s.date, 'YYYY-MM') as month,
                SUM(si.quantity * si.price) as revenue,
                SUM(si.quantity * p.cost) as cost
            FROM sales s
            JOIN sale_items si ON s.id = si.saleid
            JOIN products p ON si.productid = p.id
            GROUP BY TO_CHAR(s.date, 'YYYY-MM')
            ORDER BY month ASC
        `);

        const monthly = result.rows.map(row => {
            const revenue = parseFloat(row.revenue);
            const cost = parseFloat(row.cost);
            const profit = revenue - cost;
            return {
                month: row.month,
                revenue: revenue.toFixed(2),
                cost: cost.toFixed(2),
                profit: profit.toFixed(2)
            };
        });

        const totalRevenue = monthly.reduce((sum, m) => sum + parseFloat(m.revenue), 0);
        const totalProfit = monthly.reduce((sum, m) => sum + parseFloat(m.profit), 0);
        const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        res.json({
            monthly,
            summary: {
                totalRevenue: totalRevenue.toFixed(2),
                totalProfit: totalProfit.toFixed(2),
                margin: margin.toFixed(1) + '%'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/financial/promotions', cacheService.middleware(300), async (req, res) => {
    res.json({
        roi: "3.2x",
        activePromotions: 2,
        revenueGenerated: "15420.50"
    });
});

// ============ EXPORT ENDPOINTS (ESC-17) ============

app.get('/api/reports/export/inventory', async (req, res) => {
    try {
        // Audit Log
        await auditService.logAction('admin', 'EXPORT_REPORT', 'INVENTORY', { format: 'PDF' });

        // Simulate occasional server busy/failure for testing retry logic (10% chance)
        if (Math.random() < 0.1) {
            return res.status(503).json({ error: 'Server busy, please retry' });
        }

        const result = await pool.query(`
            SELECT p.name, p.category, p.stock, p.price 
            FROM products p 
            ORDER BY p.category, p.name
        `);

        const doc = new PDFDocument();

        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.pdf');

        doc.pipe(res);

        // Title
        doc.fontSize(20).text('Reporte de Inventario', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generado: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        // Table Header
        const tableTop = 150;
        const itemX = 50;
        const categoryX = 250;
        const stockX = 350;
        const priceX = 450;

        doc.font('Helvetica-Bold');
        doc.text('Producto', itemX, tableTop);
        doc.text('Categoría', categoryX, tableTop);
        doc.text('Stock', stockX, tableTop);
        doc.text('Precio', priceX, tableTop);

        doc.moveTo(itemX, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table Rows
        let y = tableTop + 25;
        doc.font('Helvetica');

        result.rows.forEach(item => {
            if (y > 700) { // Add new page if near bottom
                doc.addPage();
                y = 50;
            }

            doc.text(item.name, itemX, y);
            doc.text(item.category, categoryX, y);
            doc.text(item.stock.toString(), stockX, y);
            doc.text(`S/ ${parseFloat(item.price).toFixed(2)}`, priceX, y);

            y += 20;
        });

        doc.end();

    } catch (err) {
        console.error("Export Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});


app.get('/api/reports/export/sales', async (req, res) => {
    try {
        // Audit Log
        await auditService.logAction('admin', 'EXPORT_REPORT', 'SALES', { format: 'PDF' });

        const result = await pool.query(`
            SELECT DATE(date) as date, SUM(total) as total, COUNT(*) as count 
            FROM sales 
            GROUP BY DATE(date) 
            ORDER BY date DESC
        `);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
        doc.pipe(res);

        doc.fontSize(20).text('Reporte de Ventas', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generado: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        const tableTop = 150;
        doc.font('Helvetica-Bold');
        doc.text('Fecha', 50, tableTop);
        doc.text('Transacciones', 250, tableTop);
        doc.text('Total Ventas', 450, tableTop);
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 25;
        doc.font('Helvetica');
        result.rows.forEach(row => {
            if (y > 700) { doc.addPage(); y = 50; }
            doc.text(row.date.toISOString().split('T')[0], 50, y);
            doc.text(row.count.toString(), 250, y);
            doc.text(`S/ ${parseFloat(row.total).toFixed(2)}`, 450, y);
            y += 20;
        });
        doc.end();
    } catch (err) {
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/export/financial', async (req, res) => {
    try {
        // Audit Log
        await auditService.logAction('admin', 'EXPORT_REPORT', 'FINANCIAL', { format: 'PDF' });

        const result = await pool.query(`
            SELECT TO_CHAR(s.date, 'YYYY-MM') as month,
                   SUM(si.quantity * si.price) as revenue,
                   SUM(si.quantity * p.cost) as cost
            FROM sales s
            JOIN sale_items si ON s.id = si.saleid
            JOIN products p ON si.productid = p.id
            GROUP BY TO_CHAR(s.date, 'YYYY-MM')
            ORDER BY month ASC
        `);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=financial_report.pdf');
        doc.pipe(res);

        doc.fontSize(20).text('Reporte Financiero', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generado: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        const tableTop = 150;
        doc.font('Helvetica-Bold');
        doc.text('Mes', 50, tableTop);
        doc.text('Ingresos', 200, tableTop);
        doc.text('Costos', 350, tableTop);
        doc.text('Utilidad', 480, tableTop);
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 25;
        doc.font('Helvetica');
        result.rows.forEach(row => {
            if (y > 700) { doc.addPage(); y = 50; }
            const revenue = parseFloat(row.revenue);
            const cost = parseFloat(row.cost);
            const profit = revenue - cost;

            doc.text(row.month, 50, y);
            doc.text(`S/ ${revenue.toFixed(2)}`, 200, y);
            doc.text(`S/ ${cost.toFixed(2)}`, 350, y);
            doc.text(`S/ ${profit.toFixed(2)}`, 480, y);
            y += 20;
        });
        doc.end();
    } catch (err) {
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/export/products', async (req, res) => {
    try {
        // Audit Log
        await auditService.logAction('admin', 'EXPORT_REPORT', 'PRODUCTS', { format: 'PDF' });

        const result = await pool.query(`
            SELECT p.name, p.category, SUM(si.quantity * si.price) as revenue
            FROM sale_items si
            JOIN products p ON si.productid = p.id
            GROUP BY p.id, p.name, p.category
            ORDER BY revenue DESC
            LIMIT 20
        `);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=product_analysis.pdf');
        doc.pipe(res);

        doc.fontSize(20).text('Análisis de Productos (Top 20)', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generado: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        const tableTop = 150;
        doc.font('Helvetica-Bold');
        doc.text('Producto', 50, tableTop);
        doc.text('Categoría', 300, tableTop);
        doc.text('Ingresos Generados', 450, tableTop);
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 25;
        doc.font('Helvetica');
        result.rows.forEach(row => {
            if (y > 700) { doc.addPage(); y = 50; }
            doc.text(row.name, 50, y);
            doc.text(row.category, 300, y);
            doc.text(`S/ ${parseFloat(row.revenue).toFixed(2)}`, 450, y);
            y += 20;
        });
        doc.end();
    } catch (err) {
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 [${SERVICE_NAME}] Running on port ${PORT}`);
    console.log(`📊 Connected to Shared Database: ${process.env.DB_DATABASE}`);
});
