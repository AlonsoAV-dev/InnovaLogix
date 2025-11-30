# Install Socket.IO in microservices
Write-Host "📦 Instalando Socket.IO en los microservicios..." -ForegroundColor Cyan

$services = @(
    "services\pos-service",
    "services\purchases-service",
    "services\crm-service"
)

foreach ($service in $services) {
    Write-Host "`n🔧 Instalando en $service..." -ForegroundColor Yellow
    Set-Location $service
    npm install socket.io@^4.7.2
    Set-Location ..\..
}

Write-Host "`n✅ Socket.IO instalado en todos los servicios!" -ForegroundColor Green
Write-Host "`n💡 Ahora puedes reiniciar los servicios para que los cambios surtan efecto." -ForegroundColor Cyan
