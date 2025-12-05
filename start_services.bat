@echo off
echo Starting all services...

cd services

start "API Gateway" cmd /k "cd gateway && npm start"
start "Inventory Service" cmd /k "cd inventory-service && npm start"
start "CRM Service" cmd /k "cd crm-service && npm start"
start "Purchases Service" cmd /k "cd purchases-service && npm start"
start "POS Service" cmd /k "cd pos-service && npm start"
start "Reports Service" cmd /k "cd reports-service && npm start"

cd ..
start "Frontend" cmd /k "cd frontend && npm run dev"

echo All services and frontend started!
pause
