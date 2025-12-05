@echo off
echo Installing dependencies for all services...

cd services

echo [1/6] Installing Gateway dependencies...
cd gateway && call npm install && cd ..

echo [2/6] Installing Inventory Service dependencies...
cd inventory-service && call npm install && cd ..

echo [3/6] Installing CRM Service dependencies...
cd crm-service && call npm install && cd ..

echo [4/6] Installing Purchases Service dependencies...
cd purchases-service && call npm install && cd ..

echo [5/6] Installing POS Service dependencies...
cd pos-service && call npm install && cd ..

echo [6/6] Installing Reports Service dependencies...
cd reports-service && call npm install && cd ..

echo All dependencies installed!
pause
