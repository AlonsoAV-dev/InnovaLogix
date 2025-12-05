# InnovaLogix - Sistema ERP Microservicios

**Sistema ERP moderno construido con arquitectura de microservicios**  
🌲 Tema: Outdoor/Premium | 🎨 Colores: Verde Forest & Naranja Amber | 🌙 Dark/Light Mode

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Inicio Rápido](#inicio-rápido)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Módulos](#módulos)

---

## ✨ Características

### Funcionalidades Principales
- 📦 **Gestión de Inventario**: Control de stock, movimientos, alertas de reorden
- 🛒 **Punto de Venta (POS)**: Ventas, facturación, métodos de pago
- 👥 **CRM**: Gestión de clientes, reclamos, encuestas, notificaciones
- 🛍️ **Compras**: Gestión de proveedores, órdenes de compra, productos de proveedores
- 📊 **Reportes**: Análisis de ventas, inventario, productos, finanzas (con exportación PDF)

### Características Técnicas
- 🏗️ Arquitectura de microservicios
- 🔐 Autenticación y autorización
- 🌐 API Gateway centralizado
- 📡 Notificaciones en tiempo real
- 🎨 Interfaz moderna con tema dark/light
- 📱 Diseño responsive
- 🔄 Sincronización de datos entre servicios

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│                    http://localhost:5173                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Express)                    │
│                    http://localhost:3000                    │
└─────────┬───────────┬───────────┬──────────┬────────────────┘
          │           │           │          │
    ┌─────▼─────┐ ┌──▼────┐ ┌───▼────┐ ┌──▼──────┐
    │ Inventory │ │  CRM  │ │  POS   │ │Purchases│
    │   :3001   │ │ :3002 │ │ :3004  │ │  :3003  │
    └─────┬─────┘ └───┬───┘ └───┬────┘ └────┬────┘
          │           │         │           │
          ▼           ▼         ▼           ▼
    ┌─────────────────────────────────────────┐
    │         PostgreSQL Databases            │
    │  inventory_db | crm_db | pos_db |      │
    │  purchases_db | reports_db              │
    └─────────────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   Reports    │
                  │    :3005     │
                  └──────────────┘
```

---

## 🛠️ Tecnologías

### Backend
- **Node.js** 22.x
- **Express** 5.x
- **PostgreSQL** 15+
- **pg** (PostgreSQL client)
- **dotenv** (Configuración)
- **pdfkit** (Generación de PDFs)

### Frontend
- **React** 19.x
- **Vite** 6.x
- **React Router** (Navegación)
- **Recharts** (Gráficos)
- **Axios** (HTTP Client)
- **Lucide React** (Iconos)

### Base de Datos
- **PostgreSQL** con Foreign Data Wrappers (FDW)
- Bases de datos independientes por servicio
- Base de datos consolidada para reportes

---

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 22.x o superior
- PostgreSQL 15 o superior
- PowerShell (Windows) o Bash (Linux/Mac)

### 1️⃣ Configurar Bases de Datos

```sql
-- Conectarse a PostgreSQL
psql -U postgres

-- Crear bases de datos
CREATE DATABASE inventory_db;
CREATE DATABASE crm_db;
CREATE DATABASE purchases_db;
CREATE DATABASE pos_db;
CREATE DATABASE reports_db;
```

### 2️⃣ Configurar Base de Datos de Reportes

```powershell
# Ejecutar script de configuración
$env:PGPASSWORD='admin123'; psql -U postgres -h localhost -p 5432 -f "scripts\setup-reports-db.sql"
```

Este script crea la base de datos `reports_db` con Foreign Data Wrappers que consolidan datos de todos los servicios.

### 3️⃣ Instalar Dependencias

**Opción A - Automático (Recomendado):**
```powershell
.\scripts\init.ps1
```

**Opción B - Manual:**
```powershell
cd services\gateway; npm install
cd ..\inventory-service; npm install
cd ..\crm-service; npm install
cd ..\purchases-service; npm install
cd ..\pos-service; npm install
cd ..\reports-service; npm install
cd ..\..\frontend; npm install
```

### 4️⃣ Configurar Variables de Entorno

Cada servicio ya tiene su archivo `.env` configurado. Si necesitas cambiar credenciales de PostgreSQL, edita:
- `services/inventory-service/.env`
- `services/crm-service/.env`
- `services/purchases-service/.env`
- `services/pos-service/.env`
- `services/reports-service/.env`

**Configuración por defecto:**
```env
DB_USER=postgres
DB_HOST=localhost
DB_PASSWORD=admin123
DB_PORT=5432
```

### 5️⃣ Iniciar el Sistema

**Opción A - Script Automático (Recomendado):**
```powershell
.\start-all-services.ps1
```

Este script inicia todos los servicios en terminales separadas automáticamente.

**Opción B - Manual (7 terminales PowerShell):**

```powershell
# Terminal 1 - Gateway
cd services\gateway; npm start

# Terminal 2 - Inventory
cd services\inventory-service; npm start

# Terminal 3 - CRM
cd services\crm-service; npm start

# Terminal 4 - Purchases
cd services\purchases-service; npm start

# Terminal 5 - POS
cd services\pos-service; npm start

# Terminal 6 - Reports
cd services\reports-service; npm start

# Terminal 7 - Frontend
cd frontend; npm run dev
```

### 6️⃣ Acceder al Sistema

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:3000
- **Credenciales de prueba**:
  - Usuario: `admin` / Contraseña: `admin123`
  - Usuario: `user` / Contraseña: `user123`

---

## 📁 Estructura del Proyecto

```
InnovaLogix/
├── frontend/                  # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── context/          # Contextos de React
│   │   ├── layout/           # Layouts y navegación
│   │   ├── pages/            # Páginas de la aplicación
│   │   │   ├── CRM/
│   │   │   ├── Inventory/
│   │   │   ├── POS/
│   │   │   ├── Purchases/
│   │   │   └── Reports/
│   │   ├── services/         # Servicios API
│   │   └── styles/           # Estilos globales
│   └── package.json
├── services/
│   ├── gateway/              # API Gateway (Puerto 3000)
│   ├── inventory-service/    # Servicio de Inventario (Puerto 3001)
│   ├── crm-service/          # Servicio de CRM (Puerto 3002)
│   ├── purchases-service/    # Servicio de Compras (Puerto 3003)
│   ├── pos-service/          # Servicio de POS (Puerto 3004)
│   └── reports-service/      # Servicio de Reportes (Puerto 3005)
├── scripts/
│   ├── init.ps1                    # Instalación automática
│   ├── setup-databases.ps1         # Configuración de DBs
│   └── setup-reports-db.sql        # Configuración de reports_db
├── start-all-services.ps1          # Inicio automático
└── README.md
```

---

## 📦 Módulos

### 🏪 Inventario (Puerto 3001)
- Gestión de productos
- Control de stock
- Movimientos de inventario
- Alertas de stock mínimo
- Categorización de productos

### 👥 CRM (Puerto 3002)
- Gestión de clientes
- Sistema de reclamos
- Encuestas de satisfacción
- Notificaciones
- Historial de interacciones

### 🛍️ Compras (Puerto 3003)
- Gestión de proveedores
- Catálogo de productos de proveedores
- Órdenes de compra
- Seguimiento de compras

### 🛒 POS - Punto de Venta (Puerto 3004)
- Registro de ventas
- Múltiples métodos de pago
- Gestión de ítems de venta
- Facturación
- Integración con inventario

### 📊 Reportes (Puerto 3005)
- **Reportes de Ventas**: Tendencias, totales, transacciones
- **Análisis de Productos**: Rankings, rotación, márgenes
- **Gestión de Inventario**: Stock por categoría, productos críticos
- **Reportes Financieros**: Ganancias netas, promociones
- **Exportación a PDF**: Todos los reportes exportables

---

## 🔧 Scripts Útiles

```powershell
# Iniciar todos los servicios
.\start-all-services.ps1

# Instalar todas las dependencias
.\scripts\init.ps1

# Configurar bases de datos
.\scripts\setup-databases.ps1

# Recrear base de datos de reportes
$env:PGPASSWORD='admin123'; psql -U postgres -f "scripts\setup-reports-db.sql"
```

---

## 🎨 Tema Visual

El sistema utiliza un tema **Outdoor/Premium** con:
- **Color Primario**: Verde Forest (#2E7D32)
- **Color Secundario**: Naranja Amber (#FF6F00)
- **Modo Oscuro**: Por defecto
- **Modo Claro**: Disponible
- **Transiciones suaves** entre temas

---

## 📝 Notas Importantes

1. **Base de Datos de Reportes**: Usa Foreign Data Wrappers (FDW) para consultar datos de múltiples bases de datos sin duplicación
2. **Autenticación**: Implementada en todos los servicios con validación de tokens
3. **CORS**: Configurado para permitir comunicación entre servicios
4. **Notificaciones**: Integradas en CRM, Purchases e Inventory
5. **Exportación PDF**: Disponible en todos los módulos de reportes

---

## 👥 Credenciales de Prueba

```
Administrador:
  Usuario: admin
  Contraseña: admin123

Usuario Regular:
  Usuario: user
  Contraseña: user123
```

---

## 📞 Puertos del Sistema

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Gateway | 3000 | http://localhost:3000 |
| Inventory | 3001 | http://localhost:3001 |
| CRM | 3002 | http://localhost:3002 |
| Purchases | 3003 | http://localhost:3003 |
| POS | 3004 | http://localhost:3004 |
| Reports | 3005 | http://localhost:3005 |

---

**Desarrollado con ❤️ usando arquitectura de microservicios**
