# API Gateway - InnovaLogix

## 📋 Descripción

API Gateway que actúa como punto de entrada único para todos los microservicios del sistema ERP InnovaLogix. Maneja el enrutamiento, rate limiting y gestión centralizada de peticiones.

## 🚀 Características

- **Proxy Inteligente**: Enruta requests a los microservicios correspondientes
- **Rate Limiting**: Protección contra abuso (100 req/min por IP por defecto)
- **CORS**: Configurado para permitir requests del frontend
- **Health Check**: Endpoint `/health` para monitoreo
- **Error Handling**: Manejo centralizado de errores con mensajes claros

## 📦 Instalación

```bash
cd services/gateway
npm install
```

## ⚙️ Configuración

Crea un archivo `.env` basado en `.env.example`:

```env
PORT=3000
INVENTORY_SERVICE_URL=http://localhost:3001
CRM_SERVICE_URL=http://localhost:3002
PURCHASES_SERVICE_URL=http://localhost:3003
POS_SERVICE_URL=http://localhost:3004
REPORTS_SERVICE_URL=http://localhost:3005
```

## 🏃 Ejecución

```bash
# Modo producción
npm start

# Modo desarrollo (auto-reload)
npm run dev
```

## 🔗 Rutas

### Inventory Service
- `/api/products/*` → Productos
- `/api/inventory/*` → Inventario
- `/api/alerts/*` → Alertas de stock

### CRM Service
- `/api/customers/*` → Clientes
- `/api/claims/*` → Reclamos
- `/api/surveys/*` → Encuestas
- `/api/loyalty/*` → Programa de lealtad

### Purchases Service
- `/api/suppliers/*` → Proveedores
- `/api/purchases/*` → Órdenes de compra
- `/api/price-comparison/*` → Comparación de precios

### POS Service
- `/api/sales/*` → Ventas
- `/api/receipts/*` → Recibos/Comprobantes

### Reports Service
- `/api/reports/*` → Reportes
- `/api/analytics/*` → Análisis
- `/api/dashboard/*` → Dashboard

## 🔍 Health Check

```bash
GET http://localhost:3000/health
```

Respuesta:
```json
{
  "status": "OK",
  "timestamp": "2025-11-28T...",
  "services": {
    "inventory": "http://localhost:3001",
    "crm": "http://localhost:3002",
    ...
  }
}
```

## 🛡️ Seguridad

- **Rate Limiting**: Configurado para prevenir abuse
- **CORS**: Permite solo orígenes específicos (configurable)
- **Error Masking**: No expone detalles internos en producción

## 📊 Logs

El gateway registra todas las peticiones entrantes y salientes:
```
[Gateway] Proxying GET request to: http://localhost:3001/api/products
```

## 🔄 Reintentos y Circuit Breaker

**TODO**: Implementar circuit breaker pattern para manejar fallos de microservicios.
