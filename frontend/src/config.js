// API Configuration for Frontend
// Change this to point to your API Gateway

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export const API_CONFIG = {
    // API Gateway URL
    baseURL: API_BASE_URL,
    
    // WebSocket URL (connects directly to Inventory Service)
    wsURL: WS_URL,
    
    // API Endpoints (all go through Gateway)
    endpoints: {
        // Products & Inventory
        products: `${API_BASE_URL}/api/products`,
        alerts: `${API_BASE_URL}/api/alerts`,
        inventory: `${API_BASE_URL}/api/inventory`,
        
        // Customers & CRM
        customers: `${API_BASE_URL}/api/customers`,
        claims: `${API_BASE_URL}/api/claims`,
        surveys: `${API_BASE_URL}/api/surveys`,
        loyalty: `${API_BASE_URL}/api/loyalty`,
        
        // Suppliers & Purchases
        suppliers: `${API_BASE_URL}/api/suppliers`,
        purchases: `${API_BASE_URL}/api/purchases`,
        priceComparison: `${API_BASE_URL}/api/price-comparison`,
        
        // Sales & POS
        sales: `${API_BASE_URL}/api/sales`,
        receipts: `${API_BASE_URL}/api/receipts`,
        
        // Reports & Analytics
        reports: `${API_BASE_URL}/api/reports`,
        analytics: `${API_BASE_URL}/api/analytics`,
        dashboard: `${API_BASE_URL}/api/dashboard`,
    }
};

export default API_CONFIG;
