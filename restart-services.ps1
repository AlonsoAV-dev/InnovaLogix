# Restart All Services with Socket.IO
Write-Host "🔄 Reiniciando todos los servicios..." -ForegroundColor Cyan

# Stop all running node processes (be careful!)
Write-Host "`n🛑 Deteniendo servicios existentes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "`n✅ Servicios detenidos. Iniciando servicios actualizados..." -ForegroundColor Green

# Start Gateway
Write-Host "`n🚀 Iniciando Gateway (puerto 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\gateway'; npm start"
Start-Sleep -Seconds 3

# Start Inventory Service
Write-Host "🚀 Iniciando Inventory Service (puerto 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\inventory-service'; npm start"
Start-Sleep -Seconds 2

# Start CRM Service
Write-Host "🚀 Iniciando CRM Service (puerto 3002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\crm-service'; npm start"
Start-Sleep -Seconds 2

# Start Purchases Service
Write-Host "🚀 Iniciando Purchases Service (puerto 3003)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\purchases-service'; npm start"
Start-Sleep -Seconds 2

# Start POS Service
Write-Host "🚀 Iniciando POS Service (puerto 3004)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\pos-service'; npm start"
Start-Sleep -Seconds 2

# Start Reports Service
Write-Host "🚀 Iniciando Reports Service (puerto 3005)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'services\reports-service'; npm start"
Start-Sleep -Seconds 2

Write-Host "`n✅ Todos los servicios iniciados!" -ForegroundColor Green
Write-Host "🔌 WebSocket está disponible en:" -ForegroundColor Cyan
Write-Host "   - Inventory: ws://localhost:3001" -ForegroundColor White
Write-Host "   - CRM:       ws://localhost:3002" -ForegroundColor White
Write-Host "   - Purchases: ws://localhost:3003" -ForegroundColor White
Write-Host "   - POS:       ws://localhost:3004" -ForegroundColor White
Write-Host "`n💡 Ahora inicia el frontend con: cd frontend && npm run dev" -ForegroundColor Yellow
