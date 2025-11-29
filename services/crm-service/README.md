# CRM Service - InnovaLogix

## 📋 Descripción
Microservicio de gestión de relaciones con clientes (CRM). Maneja clientes, reclamos, encuestas de satisfacción y programa de lealtad.

## 🗄️ Base de Datos
PostgreSQL: `crm_db`

```bash
psql -U postgres
CREATE DATABASE crm_db;
```

## 📡 API Endpoints

### Customers
- `GET /api/customers` - Listar clientes
- `GET /api/customers/:id` - Obtener cliente
- `POST /api/customers` - Crear cliente
- `PUT /api/customers/:id` - Actualizar cliente
- `DELETE /api/customers/:id` - Eliminar cliente
- `POST /api/customers/:id/purchase` - Actualizar compras y puntos

### Claims
- `GET /api/claims` - Listar reclamos
- `POST /api/claims` - Crear reclamo
- `PUT /api/claims/:id` - Actualizar reclamo

### Surveys
- `GET /api/surveys` - Listar encuestas
- `POST /api/surveys` - Crear encuesta
- `GET /api/surveys/average` - Promedio de satisfacción

### Loyalty
- `GET /api/loyalty/top-customers` - Top 10 clientes

## 🏃 Ejecución
```bash
npm install
npm start
```

**Puerto:** 3002
