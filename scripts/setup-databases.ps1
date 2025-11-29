# Script para configurar las bases de datos PostgreSQL
# Ejecutar con: .\setup-databases.ps1

Write-Host "Configurando bases de datos PostgreSQL..." -ForegroundColor Cyan
Write-Host ""

$DB_USER = "postgres"
$services = @(
    @{name="inventory-service"; db="inventory_db"},
    @{name="crm-service"; db="crm_db"},
    @{name="purchases-service"; db="purchases_db"},
    @{name="pos-service"; db="pos_db"}
)

# Crear bases de datos
Write-Host "Creando bases de datos..." -ForegroundColor Green
foreach ($service in $services) {
    Write-Host "  -> Creando $($service.db)" -ForegroundColor Gray
    psql -U $DB_USER -c "CREATE DATABASE $($service.db);" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    OK - $($service.db) creada" -ForegroundColor Green
    } else {
        Write-Host "    -> $($service.db) ya existe o error" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Ejecutando schemas..." -ForegroundColor Green

# Ejecutar schemas
foreach ($service in $services) {
    $schemaFile = "services/$($service.name)/schema.sql"
    if (Test-Path $schemaFile) {
        Write-Host "  -> $($service.name)/schema.sql" -ForegroundColor Gray
        psql -U $DB_USER -d $($service.db) -f $schemaFile
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    OK - Schema ejecutado" -ForegroundColor Green
        } else {
            Write-Host "    ERROR ejecutando schema" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Cargando datos de ejemplo..." -ForegroundColor Green

# Cargar datos
foreach ($service in $services) {
    $dataFile = "services/$($service.name)/data.sql"
    if (Test-Path $dataFile) {
        Write-Host "  -> $($service.name)/data.sql" -ForegroundColor Gray
        psql -U $DB_USER -d $($service.db) -f $dataFile
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    OK - Datos cargados" -ForegroundColor Green
        } else {
            Write-Host "    ERROR cargando datos" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Bases de datos configuradas!" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes iniciar los servicios:" -ForegroundColor Cyan
Write-Host "   Abre 6 terminales y ejecuta:" -ForegroundColor White
Write-Host ""
Write-Host "   cd services/gateway && npm start" -ForegroundColor Gray
Write-Host "   cd services/inventory-service && npm start" -ForegroundColor Gray
Write-Host "   cd services/crm-service && npm start" -ForegroundColor Gray
Write-Host "   cd services/purchases-service && npm start" -ForegroundColor Gray
Write-Host "   cd services/pos-service && npm start" -ForegroundColor Gray
Write-Host "   cd services/reports-service && npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "   Y en otra terminal para el frontend:" -ForegroundColor White
Write-Host "   cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
