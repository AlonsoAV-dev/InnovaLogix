# InnovaLogix - Estructura de Microservicios

## 🏗️ Árbol Completo del Proyecto

```
InnovaLogix/
│
├── 📁 services/                                    # Directorio de todos los microservicios
│   │
│   ├── 📁 gateway/                                 # API Gateway (Puerto 3000)
│   │   ├── 📄 server.js                           # Servidor Express con proxy
│   │   ├── 📄 package.json                        # Dependencias: express, axios, cors, rate-limit
│   │   ├── 📄 .env.example                        # Variables de entorno (URLs de servicios)
│   │   └── 📄 README.md                           # Documentación del gateway
│   │
│   ├── 📁 inventory-service/                       # Servicio de Inventario (Puerto 3001)
│   │   ├── 📄 server.js                           # API REST + WebSocket
│   │   ├── 📄 database.js                         # Conexión PostgreSQL + inicialización
│   │   ├── 📄 schema.sql                          # Tablas: products, inventory_movements
│   │   ├── 📄 data.sql                            # Datos iniciales (8 productos)
│   │   ├── 📄 package.json                        # Dependencias: express, pg, socket.io, axios
│   │   ├── 📄 .env.example                        # DB: inventory_db
│   │   └── 📄 README.md                           # Documentación completa
│   │   │
│   │   └── 🔑 Funcionalidades:
│   │       • CRUD de productos
│   │       • Cache (Map) para lecturas rápidas (CQRS)
│   │       • WebSocket para notificaciones en tiempo real
│   │       • Kardex (historial de movimientos)
│   │       • Alertas de stock bajo
│   │       • Endpoint para actualizar stock (llamado por POS y Purchases)
│   │
│   ├── 📁 crm-service/                            # Servicio de CRM (Puerto 3002)
│   │   ├── 📄 server.js                           # API REST
│   │   ├── 📄 database.js                         # Conexión PostgreSQL
│   │   ├── 📄 schema.sql                          # Tablas: customers, claims, surveys
│   │   ├── 📄 data.sql                            # Datos iniciales (5 clientes, reclamos, encuestas)
│   │   ├── 📄 package.json                        # Dependencias: express, pg, cors
│   │   ├── 📄 .env.example                        # DB: crm_db
│   │   └── 📄 README.md                           # Documentación
│   │   │
│   │   └── 🔑 Funcionalidades:
│   │       • Gestión de clientes (CRUD)
│   │       • Reclamos y seguimiento
│   │       • Encuestas de satisfacción
│   │       • Programa de lealtad (puntos)
│   │       • Actualizar compras y puntos (llamado por POS)
│   │
│   ├── 📁 purchases-service/                       # Servicio de Compras (Puerto 3003)
│   │   ├── 📄 server.js                           # API REST
│   │   ├── 📄 database.js                         # Conexión PostgreSQL
│   │   ├── 📄 schema.sql                          # Tablas: suppliers, purchases, purchase_items, supplier_products
│   │   ├── 📄 data.sql                            # Datos iniciales (3 proveedores, precios)
│   │   ├── 📄 package.json                        # Dependencias: express, pg, axios
│   │   ├── 📄 .env.example                        # DB: purchases_db, URL: Inventory
│   │   └── 📄 README.md                           # Documentación
│   │   │
│   │   └── 🔑 Funcionalidades:
│   │       • Gestión de proveedores
│   │       • Órdenes de compra
│   │       • Comparación de precios entre proveedores
│   │       • Confirmar compra → actualiza inventario (HTTP a Inventory)
│   │
│   ├── 📁 pos-service/                            # Servicio de Punto de Venta (Puerto 3004)
│   │   ├── 📄 server.js                           # API REST
│   │   ├── 📄 database.js                         # Conexión PostgreSQL
│   │   ├── 📄 schema.sql                          # Tablas: sales, sale_items
│   │   ├── 📄 data.sql                            # Datos iniciales (2 ventas de ejemplo)
│   │   ├── 📄 package.json                        # Dependencias: express, pg, axios
│   │   ├── 📄 .env.example                        # DB: pos_db, URLs: Inventory, CRM
│   │   └── 📄 README.md                           # Documentación
│   │   │
│   │   └── 🔑 Funcionalidades:
│   │       • Crear ventas con múltiples productos
│   │       • Generar recibos (Boleta, Factura)
│   │       • Múltiples métodos de pago
│   │       • Crear venta → actualiza stock (HTTP a Inventory)
│   │       • Crear venta → actualiza puntos cliente (HTTP a CRM)
│   │
│   └── 📁 reports-service/                         # Servicio de Reportes (Puerto 3005)
│       ├── 📄 server.js                           # API REST (sin base de datos)
│       ├── 📄 package.json                        # Dependencias: express, axios
│       ├── 📄 .env.example                        # URLs: Todos los servicios
│       └── 📄 README.md                           # Documentación
│       │
│       └── 🔑 Funcionalidades:
│           • Dashboard con métricas generales
│           • Reportes de ventas por fecha/método de pago
│           • Reportes de inventario por categoría
│           • Reportes de clientes por tipo
│           • Analytics y tendencias (últimos 7 días)
│           • Agrega datos de TODOS los servicios vía HTTP
│
├── 📁 frontend/                                    # Frontend React (Puerto 5173)
│   ├── 📁 src/
│   │   ├── 📁 components/                         # Componentes reutilizables
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   │
│   │   ├── 📁 pages/                              # Páginas principales
│   │   │   ├── 📁 Inventory/                      # Gestión de inventario
│   │   │   ├── 📁 POS/                            # Punto de venta
│   │   │   ├── 📁 Purchases/                      # Compras
│   │   │   ├── 📁 CRM/                            # CRM
│   │   │   └── 📁 Reports/                        # Reportes
│   │   │
│   │   ├── 📁 context/                            # State management
│   │   │   └── StoreContext.jsx                   # Context API + WebSocket
│   │   │
│   │   ├── 📁 services/                           # API clients
│   │   │   ├── socketService.js                   # WebSocket client (Singleton)
│   │   │   ├── paymentApi.js
│   │   │   ├── receiptService.js
│   │   │   └── supplierApi.js
│   │   │
│   │   ├── 📁 layout/                             # Layouts
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MainLayout.jsx
│   │   │
│   │   └── 📄 main.jsx                            # Entry point
│   │
│   ├── 📄 index.html
│   ├── 📄 vite.config.js                          # Configuración Vite
│   └── 📄 package.json                            # Dependencias: react, react-router, socket.io-client
│
├── 📄 docker-compose.yml                           # Orquestación Docker (TODO: Dockerfiles)
├── 📄 init-dbs.sql                                # Script para crear bases de datos
├── 📄 package.json                                # Dependencias raíz (legacy, ya no se usa)
├── 📄 README.md                                   # Este archivo - Documentación principal
├── 📄 README_OLD.md                               # README anterior (preservado)
└── 📄 TACTICAS_PATRONES_ARQUITECTURA.md          # Documentación de arquitectura

```

---

## 📊 Comunicación Entre Servicios (Inter-Service Communication)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                       http://localhost:5173                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Express)                       │
│                       http://localhost:3000                      │
│  • Rate Limiting (100 req/min)                                  │
│  • Proxy inteligente                                            │
│  • CORS                                                          │
└───────────┬───────────┬──────────┬───────────┬──────────────────┘
            │           │          │           │
            ▼           ▼          ▼           ▼
    ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
    │Inventory │  │   CRM   │  │Purchases│  │   POS   │
    │  :3001   │  │  :3002  │  │  :3003  │  │  :3004  │
    └────┬─────┘  └────┬────┘  └────┬────┘  └────┬────┘
         │             │            │            │
         │             │            │            │
    ┌────▼────┐   ┌────▼────┐  ┌───▼─────┐  ┌───▼────┐
    │inventory│   │  crm_db │  │purchases│  │pos_db  │
    │   _db   │   │   (PG)  │  │  _db    │  │  (PG)  │
    │  (PG)   │   └─────────┘  │  (PG)   │  └────────┘
    └─────────┘                 └─────────┘
         ▲                           ▲           ▲
         │                           │           │
         │    HTTP Calls (axios)     │           │
         └───────────────┬───────────┴───────────┘
                         │
                    ┌────▼─────┐
                    │ Reports  │
                    │  :3005   │
                    └──────────┘
                    (Sin DB - Agrega de otros servicios)

    Leyenda:
    → : HTTP Request/Response
    ▲ : Acceso a base de datos
```

### Flujos de Comunicación Principales:

#### 1. **Crear Venta (POS → Inventory + CRM)**
```
Frontend → Gateway → POS Service
                     └─→ Inventory Service (actualizar stock)
                     └─→ CRM Service (actualizar puntos cliente)
```

#### 2. **Confirmar Compra (Purchases → Inventory)**
```
Frontend → Gateway → Purchases Service
                     └─→ Inventory Service (aumentar stock)
```

#### 3. **Dashboard (Reports → Todos)**
```
Frontend → Gateway → Reports Service
                     ├─→ Inventory Service (productos)
                     ├─→ CRM Service (clientes)
                     ├─→ Purchases Service (proveedores)
                     └─→ POS Service (ventas)
```

---

## 🗄️ Bases de Datos por Servicio

| Servicio | Base de Datos | Tablas | Propósito |
|----------|---------------|--------|-----------|
| **Inventory** | `inventory_db` | `products`, `inventory_movements` | Productos y kardex |
| **CRM** | `crm_db` | `customers`, `claims`, `surveys` | Clientes y satisfacción |
| **Purchases** | `purchases_db` | `suppliers`, `purchases`, `purchase_items`, `supplier_products` | Compras y proveedores |
| **POS** | `pos_db` | `sales`, `sale_items` | Ventas y recibos |
| **Reports** | - | - | Sin DB (agrega de otros) |

**Importante**: Cada servicio es **dueño** de su base de datos. Otros servicios NO acceden directamente a sus tablas, solo vía API REST.

---

## 🚀 Puertos por Servicio

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 5173 | http://localhost:5173 |
| API Gateway | 3000 | http://localhost:3000 |
| Inventory | 3001 | http://localhost:3001 |
| CRM | 3002 | http://localhost:3002 |
| Purchases | 3003 | http://localhost:3003 |
| POS | 3004 | http://localhost:3004 |
| Reports | 3005 | http://localhost:3005 |
| PostgreSQL | 5432 | localhost:5432 |

---

## 📦 Dependencias por Servicio

### Gateway
```json
"express", "cors", "axios", "express-rate-limit", "dotenv"
```

### Inventory, CRM, Purchases, POS
```json
"express", "cors", "pg", "dotenv", "axios"
```

### Inventory (adicional)
```json
"socket.io"
```

### Reports
```json
"express", "cors", "axios", "dotenv"
```

### Frontend
```json
"react", "react-dom", "react-router-dom", "socket.io-client", "lucide-react", "jspdf"
```

---

## 🎨 Patrones de Diseño Implementados

1. **Microservices Architecture**: Separación total de responsabilidades
2. **API Gateway Pattern**: Punto de entrada único
3. **Database per Service**: Cada servicio con su BD
4. **CQRS (Inventory)**: Cache (Map) para reads, PostgreSQL para writes
5. **Event-Driven (Inventory)**: WebSocket para notificaciones en tiempo real
6. **Service Layer**: Lógica de negocio separada de controladores
7. **Repository Pattern**: Abstracción de acceso a datos
8. **Singleton**: Conexión única a PostgreSQL en cada servicio
9. **Facade (Frontend)**: socketService.js encapsula Socket.IO

---

## 🔐 Seguridad Implementada

- ✅ **Rate Limiting** en Gateway (100 req/min por IP)
- ✅ **CORS** configurado en todos los servicios
- ✅ **Prepared Statements** (prevención SQL Injection)
- ✅ **Error Handling** sin exponer detalles internos
- ⏳ **JWT Authentication** (TODO)
- ⏳ **HTTPS/TLS** (TODO)

---

## 📝 Archivos de Configuración

### `.env.example` en cada servicio

**Inventory Service:**
```env
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=inventory_db
DB_PASSWORD=admin123
DB_PORT=5432
PORT=3001
SERVICE_NAME=inventory-service
```

**POS Service (con inter-service URLs):**
```env
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=pos_db
DB_PASSWORD=admin123
DB_PORT=5432
PORT=3004
SERVICE_NAME=pos-service
INVENTORY_SERVICE_URL=http://localhost:3001
CRM_SERVICE_URL=http://localhost:3002
```

---

## 🏃 Orden de Arranque Recomendado

1. **PostgreSQL** (debe estar corriendo primero)
2. **Inventory Service** (3001) - tiene WebSocket
3. **CRM Service** (3002)
4. **Purchases Service** (3003) - depende de Inventory
5. **POS Service** (3004) - depende de Inventory y CRM
6. **Reports Service** (3005) - depende de todos
7. **API Gateway** (3000) - debe arrancar cuando todos los servicios estén listos
8. **Frontend** (5173) - última capa

---

## 🧪 Testing (TODO)

- [ ] Unit Tests (Jest)
- [ ] Integration Tests (Supertest)
- [ ] E2E Tests (Playwright)
- [ ] Load Testing (k6)

---

## 📊 Métricas y Monitoreo (TODO)

- [ ] Prometheus para métricas
- [ ] Grafana para dashboards
- [ ] ELK Stack para logs
- [ ] Health checks automatizados

---

## 🚧 Roadmap

- [ ] Implementar Docker completo (Dockerfiles por servicio)
- [ ] CI/CD con GitHub Actions
- [ ] Autenticación JWT
- [ ] Message Queue (RabbitMQ/Kafka) para eventos
- [ ] Circuit Breaker pattern
- [ ] API Versioning
- [ ] Swagger/OpenAPI documentation

---

<div align="center">

**Estructura creada con ❤️ para arquitectura de microservicios**

</div>
