# Script de Inicialización Rápida - InnovaLogix Microservices
# Ejecutar con: .\init.ps1

Write-Host "🚀 Inicializando InnovaLogix Microservices..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
Write-Host "✓ Verificando Node.js..." -ForegroundColor Green
node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js no encontrado. Por favor instala Node.js 20.x" -ForegroundColor Red
    exit 1
}

# 2. Verificar PostgreSQL
Write-Host "✓ Verificando PostgreSQL..." -ForegroundColor Green
psql --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  PostgreSQL no encontrado. Asegúrate de instalarlo." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan

# 3. Instalar dependencias de cada servicio
$services = @("gateway", "inventory-service", "crm-service", "purchases-service", "pos-service", "reports-service")

foreach ($service in $services) {
    Write-Host "  → services/$service" -ForegroundColor Gray
    Set-Location "services/$service"
    npm install --silent
    Set-Location "../.."
}

# 4. Instalar dependencias del frontend
Write-Host "  → frontend" -ForegroundColor Gray
Set-Location frontend
npm install --silent
Set-Location ..

Write-Host ""
Write-Host "🗄️  Configurando variables de entorno..." -ForegroundColor Cyan

# 5. Copiar archivos .env.example a .env
foreach ($service in $services) {
    if (Test-Path "services/$service/.env.example") {
        if (-not (Test-Path "services/$service/.env")) {
            Copy-Item "services/$service/.env.example" "services/$service/.env"
            Write-Host "  ✓ services/$service/.env creado" -ForegroundColor Green
        } else {
            Write-Host "  → services/$service/.env ya existe" -ForegroundColor Gray
        }
    }
}

if (Test-Path "frontend/.env.example") {
    if (-not (Test-Path "frontend/.env")) {
        Copy-Item "frontend/.env.example" "frontend/.env"
        Write-Host "  ✓ frontend/.env creado" -ForegroundColor Green
    } else {
        Write-Host "  → frontend/.env ya existe" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Inicialización completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Crear las bases de datos PostgreSQL:" -ForegroundColor White
Write-Host "   psql -U postgres" -ForegroundColor Gray
Write-Host "   CREATE DATABASE inventory_db;" -ForegroundColor Gray
Write-Host "   CREATE DATABASE crm_db;" -ForegroundColor Gray
Write-Host "   CREATE DATABASE purchases_db;" -ForegroundColor Gray
Write-Host "   CREATE DATABASE pos_db;" -ForegroundColor Gray
Write-Host "   \q" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Ejecutar los schemas y datos:" -ForegroundColor White
Write-Host "   .\setup-databases.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Iniciar todos los servicios (7 terminales):" -ForegroundColor White
Write-Host "   cd services/gateway && npm start" -ForegroundColor Gray
Write-Host "   cd services/inventory-service && npm start" -ForegroundColor Gray
Write-Host "   cd services/crm-service && npm start" -ForegroundColor Gray
Write-Host "   cd services/purchases-service && npm start" -ForegroundColor Gray
Write-Host "   cd services/pos-service && npm start" -ForegroundColor Gray
Write-Host "   cd services/reports-service && npm start" -ForegroundColor Gray
Write-Host "   cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:    http://localhost:5173" -ForegroundColor Yellow
Write-Host "   API Gateway: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
