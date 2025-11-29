# Scripts de Utilidad y Configuración

Esta carpeta contiene scripts para inicialización, debugging y utilidades del proyecto.

## 🚀 Scripts de Inicialización

### `init.ps1`
Script principal de inicialización que:
- Verifica Node.js y PostgreSQL
- Instala dependencias de todos los servicios
- Crea archivos `.env` desde `.env.example`

**Uso:**
```powershell
.\scripts\init.ps1
```

### `setup-databases.ps1`
Configura las bases de datos PostgreSQL:
- Crea las 4 bases de datos (inventory_db, crm_db, purchases_db, pos_db)
- Ejecuta los schemas (estructura de tablas)
- Carga datos de ejemplo

**Uso:**
```powershell
.\scripts\setup-databases.ps1
```

## 🗄️ Scripts SQL

### `init-dbs.sql`
Script SQL para crear las 4 bases de datos necesarias.

### `database_dump.sql`
Backup de la base de datos (si existe).

## 🔧 Scripts de Debugging

Estos scripts son para desarrollo y debugging. Solo ejecutarlos si necesitas verificar datos específicos o hacer pruebas.

- `check_data.js` - Verifica datos en la base de datos
- `check_supplier_db.js` - Verifica proveedores
- `check_history.js` - Verifica historial
- `check_linterna.js` - Prueba específica de producto
- `debug_db.js` - Debugging general de DB
- `debug_supplier_query.js` - Debug de queries de proveedores
- `test_api.js` - Prueba endpoints del API

## 📊 Scripts de Población de Datos

- `populate_history.js` - Genera historial de movimientos
- `populate_more_data.js` - Agrega más datos de ejemplo
- `generate_full_history.js` - Genera historial completo

## 🛠️ Scripts de Mantenimiento

- `export_data.js` - Exporta datos de la DB
- `fix_negative_stock.js` - Corrige stocks negativos
- `init_kardex.js` - Inicializa el sistema Kardex
- `update_supplier_db.js` - Actualiza datos de proveedores

---

**Nota:** La mayoría de estos scripts son de debugging y no son necesarios para el funcionamiento normal de la aplicación. Solo usa `init.ps1` y `setup-databases.ps1` para la configuración inicial.
