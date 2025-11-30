# Sistema de Notificaciones en Tiempo Real

## 📋 Descripción

Sistema completo de notificaciones en tiempo real utilizando WebSocket (Socket.IO) que conecta todos los microservicios con el frontend para proporcionar feedback instantáneo sobre todas las operaciones del sistema.

## 🏗️ Arquitectura

### Backend (Microservicios)
Cada microservicio tiene su propio servidor Socket.IO integrado:

- **inventory-service** (puerto 3001) - Notificaciones de stock
- **crm-service** (puerto 3002) - Notificaciones de clientes y reclamos
- **purchases-service** (puerto 3003) - Notificaciones de compras
- **pos-service** (puerto 3004) - Notificaciones de ventas

### Frontend
- **NotificationContext**: Maneja el estado global de notificaciones
- **NotificationCenter**: Componente UI para mostrar las notificaciones
- **socketService**: Cliente WebSocket que se conecta a todos los servicios

## 📡 Eventos Emitidos

### Inventory Service (3001)
```javascript
io.emit('stockUpdate', {
    productId: number,
    productName: string,
    stock: number,
    minStock: number,
    action: 'created' | 'updated' | 'low_stock'
});
```

### POS Service (3004)
```javascript
io.emit('saleCompleted', {
    saleId: number,
    total: number,
    items: number,
    paymentMethod: string,
    timestamp: string
});
```

### Purchases Service (3003)
```javascript
io.emit('purchaseCreated', {
    purchaseId: number,
    supplierName: string,
    total: number,
    status: string
});

io.emit('purchaseConfirmed', {
    purchaseId: number,
    supplierName: string,
    total: number
});

io.emit('purchaseCancelled', {
    purchaseId: number,
    supplierName: string
});
```

### CRM Service (3002)
```javascript
io.emit('newCustomer', {
    customerId: number,
    customerName: string,
    email: string
});

io.emit('newClaim', {
    claimId: number,
    customerName: string,
    type: string,
    product: string,
    status: string
});
```

## 🎨 Tipos de Notificaciones

El sistema soporta 4 tipos de notificaciones con diferentes estilos:

- **success** (verde) - Operaciones exitosas
- **error** (rojo) - Errores o cancelaciones
- **warning** (naranja) - Alertas importantes (stock bajo, reclamos)
- **info** (azul) - Información general

## 🚀 Características

### NotificationCenter
- ✅ Panel deslizante desde el header
- ✅ Lista de notificaciones con scroll
- ✅ Contador de no leídas en el badge
- ✅ Marcado individual como leído
- ✅ Marcar todas como leídas
- ✅ Eliminar notificaciones individuales
- ✅ Limpiar todas las notificaciones
- ✅ Auto-cierre después de 10 segundos (opcional)
- ✅ Timestamp relativo (Hace 5m, Hace 2h, etc.)
- ✅ Íconos emoji personalizados por categoría

### NotificationContext
- ✅ Gestión de estado global
- ✅ Persistencia automática
- ✅ Conexión a múltiples WebSockets
- ✅ Listeners configurables
- ✅ Cleanup automático

### socketService
- ✅ Conexión a 4 microservicios simultáneamente
- ✅ Reconexión automática
- ✅ Manejo de errores
- ✅ API simple para suscripciones
- ✅ Cleanup de listeners

## 📦 Instalación

Las dependencias ya están instaladas en todos los servicios. Si necesitas reinstalar:

```bash
# En cada servicio
cd services/pos-service
npm install socket.io

cd services/purchases-service
npm install socket.io

cd services/crm-service
npm install socket.io
```

## 🔧 Uso

### En el Frontend

El sistema está completamente integrado. Solo necesitas:

```jsx
// Ya está en App.jsx
<NotificationProvider>
  <YourApp />
</NotificationProvider>

// En cualquier componente
import { useNotifications } from '../context/NotificationContext';

function MyComponent() {
  const { addNotification } = useNotifications();
  
  // Agregar notificación manualmente
  addNotification({
    type: 'success',
    title: 'Operación Exitosa',
    message: 'Los datos se guardaron correctamente',
    icon: '✅'
  });
}
```

### En el Backend

```javascript
// Ya está integrado en cada servicio
io.emit('eventName', {
    // datos del evento
});
```

## 🎯 Casos de Uso

### 1. Stock Bajo
Cuando un producto alcanza su stock mínimo:
```javascript
// Automático desde inventory-service
io.emit('stockUpdate', {
    action: 'low_stock',
    productName: 'Producto X',
    stock: 5,
    minStock: 10
});
```

### 2. Venta Completada
Cuando se registra una venta:
```javascript
// Automático desde pos-service
io.emit('saleCompleted', {
    saleId: 123,
    total: 150.50,
    items: 3
});
```

### 3. Compra Confirmada
Cuando se confirma una compra:
```javascript
// Automático desde purchases-service
io.emit('purchaseConfirmed', {
    purchaseId: 45,
    supplierName: 'Proveedor ABC'
});
```

### 4. Nuevo Reclamo
Cuando un cliente hace un reclamo:
```javascript
// Automático desde crm-service
io.emit('newClaim', {
    claimId: 78,
    customerName: 'Juan Pérez',
    type: 'Producto Defectuoso'
});
```

## 🎨 Personalización

### Cambiar duración de auto-cierre
```javascript
addNotification({
    // ...
    autoRemove: false // No se cierra automáticamente
});
```

### Agregar categorías personalizadas
En `NotificationCenter.css`:
```css
.notification-custom .notification-icon {
    background-color: rgba(156, 39, 176, 0.1);
}
```

## 📱 Responsive

El sistema es completamente responsive:
- Desktop: Panel de 380px a la derecha
- Mobile: Panel de ancho completo

## 🐛 Debugging

Para ver los logs de WebSocket en consola:
```javascript
// Ya están habilitados en socketService.js
console.log('✅ WebSocket conectado [service]:', socket.id);
console.log('📦 Actualización recibida:', data);
```

## 🔄 Reiniciar Servicios

Después de los cambios, reinicia todos los servicios:

```bash
# Terminal 1
cd services/pos-service && npm start

# Terminal 2
cd services/purchases-service && npm start

# Terminal 3
cd services/crm-service && npm start

# Terminal 4 (inventory ya tiene Socket.IO)
cd services/inventory-service && npm start

# Terminal 5
cd frontend && npm run dev
```

## ✨ Estado Actual

- ✅ Sistema de notificaciones completamente funcional
- ✅ 4 microservicios emitiendo eventos
- ✅ Frontend recibiendo y mostrando notificaciones
- ✅ UI completa con NotificationCenter
- ✅ Todos los tipos de eventos implementados
- ✅ Socket.IO instalado en todos los servicios

## 📝 Próximos Pasos (Opcional)

- [ ] Filtros de notificaciones por categoría
- [ ] Persistencia en base de datos
- [ ] Notificaciones push del navegador
- [ ] Sonidos personalizados
- [ ] Configuración de preferencias de usuario
