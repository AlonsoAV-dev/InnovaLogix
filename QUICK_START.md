# 🚀 Guía de Inicio Rápido - InnovaLogix Microservices

## Prerequisitos

- **Node.js** 20.x o superior
- **PostgreSQL** 15.x o superior
- **npm** o **yarn**

---

## Instalación Automática (Recomendado)

### 1️⃣ Instalar dependencias y configurar entorno

```powershell
.\scripts\init.ps1
```

Esto instalará todas las dependencias npm y creará archivos `.env` desde los `.env.example`.

### 2️⃣ Configurar bases de datos

```powershell
.\scripts\setup-databases.ps1
```

Esto creará las 4 bases de datos PostgreSQL, ejecutará los schemas y cargará datos de ejemplo.

### 3️⃣ Iniciar servicios

Abre **7 terminales PowerShell** y ejecuta en cada una:

```powershell
# Terminal 1 - API Gateway
cd services/gateway
npm start

# Terminal 2 - Inventory Service
cd services/inventory-service
npm start

# Terminal 3 - CRM Service
cd services/crm-service
npm start

# Terminal 4 - Purchases Service
cd services/purchases-service
npm start

# Terminal 5 - POS Service
cd services/pos-service
npm start

# Terminal 6 - Reports Service
cd services/reports-service
npm start

# Terminal 7 - Frontend
cd frontend
npm run dev
```

### 4️⃣ Acceder a la aplicación

Abre tu navegador en:
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:3000

---

## Instalación Manual

### 1. Crear bases de datos PostgreSQL

```sql
psql -U postgres

CREATE DATABASE inventory_db;
CREATE DATABASE crm_db;
CREATE DATABASE purchases_db;
CREATE DATABASE pos_db;

\q
```

### 2. Ejecutar schemas y datos

```powershell
# Inventory
psql -U postgres -d inventory_db -f services/inventory-service/schema.sql
psql -U postgres -d inventory_db -f services/inventory-service/data.sql

# CRM
psql -U postgres -d crm_db -f services/crm-service/schema.sql
psql -U postgres -d crm_db -f services/crm-service/data.sql

# Purchases
psql -U postgres -d purchases_db -f services/purchases-service/schema.sql
psql -U postgres -d purchases_db -f services/purchases-service/data.sql

# POS
psql -U postgres -d pos_db -f services/pos-service/schema.sql
psql -U postgres -d pos_db -f services/pos-service/data.sql
```

### 3. Instalar dependencias

```powershell
# Gateway
cd services/gateway
npm install

# Inventory Service
cd ../inventory-service
npm install

# CRM Service
cd ../crm-service
npm install

# Purchases Service
cd ../purchases-service
npm install

# POS Service
cd ../pos-service
npm install

# Reports Service
cd ../reports-service
npm install

# Frontend
cd ../../frontend
npm install
```

### 4. Configurar variables de entorno

Copia `.env.example` a `.env` en cada servicio y ajusta las credenciales de PostgreSQL:

```powershell
# En cada carpeta de servicio
cp .env.example .env
```

Edita cada `.env` con tus credenciales de PostgreSQL.

### 5. Iniciar servicios

Sigue el paso 3️⃣ de la instalación automática.

---

## 🔍 Verificar que todo funciona

### Health Checks

```powershell
# API Gateway
curl http://localhost:3000/health

# Inventory Service
curl http://localhost:3001/health

# CRM Service
curl http://localhost:3002/health

# Purchases Service
curl http://localhost:3003/health

# POS Service
curl http://localhost:3004/health

# Reports Service
curl http://localhost:3005/health
```

### Probar endpoints

```powershell
# Obtener productos (a través del Gateway)
curl http://localhost:3000/api/products

# Obtener clientes
curl http://localhost:3000/api/customers

# Obtener proveedores
curl http://localhost:3000/api/suppliers

# Obtener ventas
curl http://localhost:3000/api/sales
```

---

## 🐳 Ejecutar con Docker (Alternativa)

Si prefieres usar Docker:

```bash
docker-compose up -d
```

Esto levantará todos los servicios, PostgreSQL y el frontend.

---

## 📚 Documentación Adicional

- **README.md** - Documentación completa de arquitectura
- **ESTRUCTURA_MICROSERVICIOS.md** - Árbol detallado del proyecto
- **RESUMEN_MIGRACION.md** - Resumen ejecutivo de la migración
- **frontend/README.md** - Documentación del frontend
- **services/*/README.md** - Documentación de cada microservicio

---

## 🆘 Problemas Comunes

### Error: "Cannot connect to PostgreSQL"

Verifica que PostgreSQL esté corriendo:
```powershell
pg_ctl status
```

### Error: "Port already in use"

Cierra los procesos que estén usando los puertos 3000-3005 o 5173:
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Error: "Module not found"

Reinstala las dependencias:
```powershell
cd services/<servicio>
rm -rf node_modules
npm install
```

---

## 🎯 Flujo de Prueba Completo

1. **Accede al frontend**: http://localhost:5173
2. **Navega a Inventario**: Verifica que veas los 8 productos de ejemplo
3. **Navega a POS**: Agrega productos al carrito y realiza una venta
4. **Verifica WebSocket**: Deberías ver una notificación de actualización de stock
5. **Navega a CRM**: Verifica que el cliente tenga puntos actualizados
6. **Navega a Reportes**: Verifica que veas las estadísticas actualizadas

---

## ✅ Checklist Post-Instalación

- [ ] PostgreSQL corriendo
- [ ] 4 bases de datos creadas (inventory_db, crm_db, purchases_db, pos_db)
- [ ] Schemas ejecutados en todas las bases de datos
- [ ] Datos de ejemplo cargados
- [ ] Dependencias npm instaladas en todos los servicios
- [ ] Archivos .env configurados
- [ ] 7 servicios corriendo sin errores
- [ ] Frontend accesible en http://localhost:5173
- [ ] Health checks respondiendo OK

---

¡Listo! Tu arquitectura de microservicios está funcionando. 🎉
