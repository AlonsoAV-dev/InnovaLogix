# Reports Service - InnovaLogix

## 📋 Descripción
Microservicio de reportes y análisis. Agrega datos de todos los microservicios para generar dashboards, reportes y análisis.

## 🚀 Características
- **Sin Base de Datos**: Lee datos de otros servicios
- **Agregación**: Combina información de múltiples fuentes
- **Analytics**: Tendencias y métricas calculadas

## 📡 API Endpoints

### Dashboard
- `GET /api/dashboard` - Dashboard principal con métricas generales

### Sales Reports
- `GET /api/reports/sales` - Ventas agrupadas por fecha
- `GET /api/reports/sales/payment-methods` - Ventas por método de pago

### Inventory Reports
- `GET /api/reports/inventory` - Reporte de inventario por categoría

### CRM Reports
- `GET /api/reports/customers` - Reporte de clientes por tipo

### Analytics
- `GET /api/analytics/trends` - Tendencias de ventas (últimos 7 días)

## 🔗 Data Sources
Este servicio NO tiene base de datos propia. Consulta:
- **Inventory Service** (3001): Productos y stock
- **CRM Service** (3002): Clientes y satisfacción
- **Purchases Service** (3003): Proveedores y compras
- **POS Service** (3004): Ventas

## 🏃 Ejecución
```bash
npm install
npm start
```

**Puerto:** 3005

## 📊 Ejemplo de Dashboard Response
```json
{
  "totalProducts": 8,
  "totalSales": "15420.50",
  "totalCustomers": 5,
  "lowStockAlerts": 2,
  "recentSales": [...],
  "topProducts": [...]
}
```
