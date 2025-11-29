# Purchases Service - InnovaLogix

## 📋 Descripción
Microservicio de gestión de compras y proveedores. Maneja órdenes de compra, proveedores, comparación de precios y se comunica con el servicio de inventario.

## 🗄️ Base de Datos
PostgreSQL: `purchases_db`

```bash
psql -U postgres
CREATE DATABASE purchases_db;
```

## 📡 API Endpoints

### Suppliers
- `GET /api/suppliers` - Listar proveedores
- `GET /api/suppliers/:id` - Obtener proveedor
- `POST /api/suppliers` - Crear proveedor
- `PUT /api/suppliers/:id` - Actualizar proveedor
- `DELETE /api/suppliers/:id` - Eliminar proveedor

### Purchases
- `GET /api/purchases` - Listar órdenes de compra
- `GET /api/purchases/:id` - Obtener orden con ítems
- `POST /api/purchases` - Crear orden de compra
- `PUT /api/purchases/:id/status` - Actualizar estado (Confirmed actualiza inventario)

### Price Comparison
- `GET /api/price-comparison/:productId` - Comparar precios de un producto
- `GET /api/price-comparison` - Obtener todos los precios

## 🔗 Inter-Service Communication
Cuando una compra se confirma (`status = 'Confirmed'`), este servicio llama al **Inventory Service** para actualizar el stock:

```javascript
POST http://localhost:3001/api/inventory/update-stock
{
  "productId": 1,
  "quantity": 10,
  "type": "PURCHASE",
  "reference": "Purchase #5"
}
```

## 🏃 Ejecución
```bash
npm install
npm start
```

**Puerto:** 3003
