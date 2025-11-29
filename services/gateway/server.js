import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Service URLs
const SERVICES = {
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001',
    crm: process.env.CRM_SERVICE_URL || 'http://localhost:3002',
    purchases: process.env.PURCHASES_SERVICE_URL || 'http://localhost:3003',
    pos: process.env.POS_SERVICE_URL || 'http://localhost:3004',
    reports: process.env.REPORTS_SERVICE_URL || 'http://localhost:3005'
};

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        services: SERVICES
    });
});

// Generic proxy function
const proxyRequest = async (req, res, serviceUrl) => {
    try {
        // Use originalUrl to get full path including /api prefix
        const url = `${serviceUrl}${req.originalUrl}`;
        const config = {
            method: req.method,
            url,
            data: req.body,
            params: req.query,
            headers: {
                'Content-Type': 'application/json',
                ...req.headers
            }
        };
        
        console.log(`[Gateway] Proxying ${req.method} request to: ${url}`);
        const response = await axios(config);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`[Gateway] Error proxying to ${serviceUrl}:`, error.message);
        
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            res.status(503).json({ 
                error: 'Service Unavailable', 
                message: `Cannot reach ${serviceUrl}` 
            });
        } else {
            res.status(500).json({ 
                error: 'Gateway Error', 
                message: error.message 
            });
        }
    }
};

// ============ ROUTING TO MICROSERVICES ============

// Simple routing middleware - matches paths and proxies to services
app.use('/api', (req, res, next) => {
    const path = req.path;
    
    // Inventory Service
    if (path.startsWith('/products') || path.startsWith('/inventory') || path.startsWith('/alerts')) {
        return proxyRequest(req, res, SERVICES.inventory);
    }
    
    // CRM Service
    if (path.startsWith('/customers') || path.startsWith('/claims') || path.startsWith('/surveys') || path.startsWith('/loyalty')) {
        return proxyRequest(req, res, SERVICES.crm);
    }
    
    // Purchases Service
    if (path.startsWith('/suppliers') || path.startsWith('/purchases') || path.startsWith('/price-comparison') || path.startsWith('/supplier-products')) {
        return proxyRequest(req, res, SERVICES.purchases);
    }
    
    // POS Service
    if (path.startsWith('/sales') || path.startsWith('/receipts')) {
        return proxyRequest(req, res, SERVICES.pos);
    }
    
    // Reports Service
    if (path.startsWith('/reports') || path.startsWith('/analytics') || path.startsWith('/dashboard')) {
        return proxyRequest(req, res, SERVICES.reports);
    }
    
    next(); // If no match, continue to 404 handler
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ 
        error: 'Not Found', 
        message: `Route ${req.path} not found`,
        availableServices: Object.keys(SERVICES)
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Gateway Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error', 
        message: err.message 
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📡 Proxying to services:`);
    Object.entries(SERVICES).forEach(([name, url]) => {
        console.log(`   - ${name}: ${url}`);
    });
});
