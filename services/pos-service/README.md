# POS Service - InnovaLogix

## 📋 Descripción
Microservicio de Punto de Venta. Gestiona ventas, genera recibos y se comunica con Inventory y CRM.

## 🗄️ Base de Datos
PostgreSQL: `pos_db`

```bash
CREATE DATABASE pos_db;
```

## 📡 API Endpoints
- `GET /api/sales` - Listar ventas
- `GET /api/sales/:id` - Obtener venta con ítems
- `POST /api/sales` - Crear venta (actualiza inventario y CRM)
- `GET /api/sales/range/:start/:end` - Ventas por rango de fechas
- `GET /api/sales/stats/total` - Total de ventas

## 🔗 Inter-Service Communication
- **Inventory Service**: Actualiza stock al crear venta
- **CRM Service**: Actualiza puntos y compras del cliente

## 🏃 Ejecución
```bash
npm install
npm start
```

**Puerto:** 3004
