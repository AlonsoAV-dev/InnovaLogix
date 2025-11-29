import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const SERVICE_NAME = process.env.SERVICE_NAME || 'reports-service';

const SERVICES = {
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001',
    crm: process.env.CRM_SERVICE_URL || 'http://localhost:3002',
    purchases: process.env.PURCHASES_SERVICE_URL || 'http://localhost:3003',
    pos: process.env.POS_SERVICE_URL || 'http://localhost:3004'
};

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: SERVICE_NAME, status: 'OK', timestamp: new Date().toISOString() });
});

// ============ DASHBOARD ============

app.get('/api/dashboard', async (req, res) => {
    try {
        const [products, sales, customers, alerts] = await Promise.all([
            axios.get(`${SERVICES.inventory}/api/products`).catch(() => ({ data: [] })),
            axios.get(`${SERVICES.pos}/api/sales`).catch(() => ({ data: [] })),
            axios.get(`${SERVICES.crm}/api/customers`).catch(() => ({ data: [] })),
            axios.get(`${SERVICES.inventory}/api/alerts`).catch(() => ({ data: [] }))
        ]);

        const totalProducts = products.data.length;
        const totalSales = sales.data.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
        const totalCustomers = customers.data.length;
        const lowStockAlerts = alerts.data.length;

        res.json({
            totalProducts,
            totalSales: totalSales.toFixed(2),
            totalCustomers,
            lowStockAlerts,
            recentSales: sales.data.slice(0, 5),
            topProducts: products.data.slice(0, 5)
        });
    } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Dashboard error:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// ============ SALES REPORTS ============

app.get('/api/reports/sales', async (req, res) => {
    try {
        const response = await axios.get(`${SERVICES.pos}/api/sales`);
        const sales = response.data;

        // Group by date
        const salesByDate = sales.reduce((acc, sale) => {
            const date = new Date(sale.date).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, total: 0, count: 0 };
            }
            acc[date].total += parseFloat(sale.total || 0);
            acc[date].count += 1;
            return acc;
        }, {});

        const salesData = Object.values(salesByDate).sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        res.json(salesData);
    } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Sales report error:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// Sales by payment method
app.get('/api/reports/sales/payment-methods', async (req, res) => {
    try {
        const response = await axios.get(`${SERVICES.pos}/api/sales`);
        const sales = response.data;

        const byMethod = sales.reduce((acc, sale) => {
            const method = sale.paymentmethod || 'Unknown';
            if (!acc[method]) {
                acc[method] = { method, total: 0, count: 0 };
            }
            acc[method].total += parseFloat(sale.total || 0);
            acc[method].count += 1;
            return acc;
        }, {});

        res.json(Object.values(byMethod));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ INVENTORY REPORTS ============

app.get('/api/reports/inventory', async (req, res) => {
    try {
        const response = await axios.get(`${SERVICES.inventory}/api/products`);
        const products = response.data;

        const totalValue = products.reduce((sum, p) => 
            sum + (parseFloat(p.cost || 0) * parseInt(p.stock || 0)), 0
        );

        const byCategory = products.reduce((acc, p) => {
            const cat = p.category || 'Sin categoría';
            if (!acc[cat]) {
                acc[cat] = { category: cat, products: 0, totalStock: 0 };
            }
            acc[cat].products += 1;
            acc[cat].totalStock += parseInt(p.stock || 0);
            return acc;
        }, {});

        res.json({
            totalProducts: products.length,
            totalValue: totalValue.toFixed(2),
            byCategory: Object.values(byCategory)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ CRM REPORTS ============

app.get('/api/reports/customers', async (req, res) => {
    try {
        const [customers, surveys] = await Promise.all([
            axios.get(`${SERVICES.crm}/api/customers`).catch(() => ({ data: [] })),
            axios.get(`${SERVICES.crm}/api/surveys`).catch(() => ({ data: [] }))
        ]);

        const byType = customers.data.reduce((acc, c) => {
            const type = c.type || 'Sin tipo';
            if (!acc[type]) {
                acc[type] = { type, count: 0, totalPurchases: 0 };
            }
            acc[type].count += 1;
            acc[type].totalPurchases += parseFloat(c.totalpurchases || 0);
            return acc;
        }, {});

        const avgRating = surveys.data.length > 0
            ? surveys.data.reduce((sum, s) => sum + (s.rating || 0), 0) / surveys.data.length
            : 0;

        res.json({
            totalCustomers: customers.data.length,
            byType: Object.values(byType),
            averageSatisfaction: avgRating.toFixed(2)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ ANALYTICS ============

app.get('/api/analytics/trends', async (req, res) => {
    try {
        const [sales, products] = await Promise.all([
            axios.get(`${SERVICES.pos}/api/sales`).catch(() => ({ data: [] })),
            axios.get(`${SERVICES.inventory}/api/products`).catch(() => ({ data: [] }))
        ]);

        // Last 7 days sales
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        const salesTrend = last7Days.map(date => {
            const daySales = sales.data.filter(s => 
                new Date(s.date).toISOString().split('T')[0] === date
            );
            const total = daySales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
            return { date, total: total.toFixed(2), count: daySales.length };
        });

        res.json({
            salesTrend,
            lowStockProducts: products.data.filter(p => p.stock <= p.minstock).length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 [${SERVICE_NAME}] Running on port ${PORT}`);
    console.log(`📊 Aggregating data from all services`);
    Object.entries(SERVICES).forEach(([name, url]) => {
        console.log(`   - ${name}: ${url}`);
    });
});
