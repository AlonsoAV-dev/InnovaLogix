# Frontend - React Application

## ⚙️ Configuración para Microservicios

### Variables de Entorno

Crea un archivo `.env` en la raíz del frontend:

```env
# API Gateway URL
VITE_API_URL=http://localhost:3000

# WebSocket URL (Inventory Service)
VITE_WS_URL=http://localhost:3001
```

### Uso en Componentes

```javascript
import { API_CONFIG } from './config';

// Ejemplo: Fetch products
const response = await fetch(API_CONFIG.endpoints.products);
const products = await response.json();

// Ejemplo: Create sale
const response = await fetch(API_CONFIG.endpoints.sales, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData)
});
```

## 🚀 Ejecución

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173

## 📡 Comunicación

El frontend se comunica ÚNICAMENTE con el **API Gateway (puerto 3000)**, excepto para WebSocket que conecta directamente al **Inventory Service (puerto 3001)** para notificaciones en tiempo real.

```
Frontend (5173) → API Gateway (3000) → Microservices
                ↘ WebSocket → Inventory (3001)
```
