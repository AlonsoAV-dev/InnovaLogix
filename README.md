# InnovaLogix - ERP Microservices

## Correr el Proyecto

### 1. Crear bases de datos PostgreSQL
```sql
CREATE DATABASE inventory_db;
CREATE DATABASE crm_db;
CREATE DATABASE purchases_db;
CREATE DATABASE pos_db;
```

### 2. Instalar dependencias
```powershell
cd services/gateway; npm install
cd ../inventory-service; npm install
cd ../crm-service; npm install
cd ../purchases-service; npm install
cd ../pos-service; npm install
cd ../reports-service; npm install
cd ../../frontend; npm install
```

### 3. Configurar .env
Copiar `.env.example` a `.env` en cada servicio y ajustar credenciales PostgreSQL si es necesario.

### 4. Iniciar servicios (abrir 7 ventanas PowerShell)

**Ventana 1 - Gateway:**
```powershell
cd services\gateway
npm start
```

**Ventana 2 - Inventory:**
```powershell
cd services\inventory-service
npm start
```

**Ventana 3 - CRM:**
```powershell
cd services\crm-service
npm start
```

**Ventana 4 - Purchases:**
```powershell
cd services\purchases-service
npm start
```

**Ventana 5 - POS:**
```powershell
cd services\pos-service
npm start
```

**Ventana 6 - Reports:**
```powershell
cd services\reports-service
npm start
```

**Ventana 7 - Frontend:**
```powershell
cd frontend
npm run dev
```

### 5. Acceder
- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000

---

## Arquitectura

```
Frontend (5173) → Gateway (3000) → Inventory (3001)
                                 → CRM (3002)
                                 → Purchases (3003)
                                 → POS (3004)
                                 → Reports (3005)
```

**Stack:** Node.js 22, Express 5, PostgreSQL 15, React 19, Vite
