# Script para iniciar todos los servicios de InnovaLogix
# Cada servicio se abre en su propia ventana de PowerShell

Write-Host "🚀 Iniciando todos los servicios de InnovaLogix..." -ForegroundColor Cyan

$services = @(
    @{Name="Gateway"; Path=".\services\gateway"; Port=3000}
    @{Name="Inventory"; Path=".\services\inventory-service"; Port=3001}
    @{Name="CRM"; Path=".\services\crm-service"; Port=3002}
    @{Name="Purchases"; Path=".\services\purchases-service"; Port=3003}
    @{Name="POS"; Path=".\services\pos-service"; Port=3004}
    @{Name="Reports"; Path=".\services\reports-service"; Port=3005}
)

foreach ($service in $services) {
    Write-Host "Starting $($service.Name) on port $($service.Port)..." -ForegroundColor Yellow
    
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$($service.Path)'; Write-Host '🟢 $($service.Name) Service' -ForegroundColor Green; npm start"
    )
    
    Start-Sleep -Milliseconds 500
}

Write-Host "`n✅ Todos los servicios están iniciando..." -ForegroundColor Green
Write-Host "💡 Cada servicio tiene su propia ventana de PowerShell" -ForegroundColor Cyan
Write-Host "💡 Cierra las ventanas para detener los servicios" -ForegroundColor Cyan
Write-Host "`nEspera 10 segundos y luego inicia el frontend con: cd frontend; npm run dev" -ForegroundColor Yellow
