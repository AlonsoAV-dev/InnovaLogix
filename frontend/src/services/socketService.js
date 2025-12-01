import { io } from 'socket.io-client';

// Get WebSocket URLs from environment variables
const INVENTORY_WS = import.meta.env.VITE_INVENTORY_WS || 'http://localhost:3001';
const CRM_WS = import.meta.env.VITE_CRM_WS || 'http://localhost:3002';
const PURCHASES_WS = import.meta.env.VITE_PURCHASES_WS || 'http://localhost:3003';
const POS_WS = import.meta.env.VITE_POS_WS || 'http://localhost:3004';

class SocketService {
    constructor() {
        this.sockets = {
            inventory: null,
            crm: null,
            purchases: null,
            pos: null
        };
        this.listeners = new Map();
        this.isInitialized = false; // Flag to prevent multiple initializations
        this.connectionPromises = {}; // Store connection promises
    }

    connectAll() {
        // Prevent multiple connections
        if (this.isInitialized) {
            console.log('⚠️ SocketService already initialized. Skipping reconnection.');
            return Promise.resolve(this.sockets);
        }

        console.log('🔌 Initializing WebSocket connections to all services...');
        this.isInitialized = true;

        // Connect to all microservices and store promises
        this.connectionPromises.inventory = this.connectToService('inventory', INVENTORY_WS);
        this.connectionPromises.crm = this.connectToService('crm', CRM_WS);
        this.connectionPromises.purchases = this.connectToService('purchases', PURCHASES_WS);
        this.connectionPromises.pos = this.connectToService('pos', POS_WS);
        
        // Wait for all connections
        return Promise.all([
            this.connectionPromises.inventory,
            this.connectionPromises.crm,
            this.connectionPromises.purchases,
            this.connectionPromises.pos
        ]).then(() => {
            console.log('✅ Todas las conexiones WebSocket establecidas');
            return this.sockets;
        }).catch(err => {
            console.error('❌ Error al conectar algunos servicios:', err);
            return this.sockets;
        });
    }

    connectToService(serviceName, url) {
        return new Promise((resolve, reject) => {
            const socket = io(url, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            socket.on('connect', () => {
                console.log(`✅ WebSocket conectado [${serviceName}]:`, socket.id);
                this.sockets[serviceName] = socket;
                resolve(socket);
            });

            socket.on('disconnect', (reason) => {
                console.log(`⚠️  WebSocket desconectado [${serviceName}]:`, reason);
            });

            socket.on('connect_error', (error) => {
                console.error(`❌ Error de conexión WebSocket [${serviceName}]:`, error.message);
                // Still resolve to allow other connections to proceed
                if (!this.sockets[serviceName]) {
                    this.sockets[serviceName] = socket;
                    resolve(socket);
                }
            });

            // Set socket immediately but mark as not connected
            this.sockets[serviceName] = socket;
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (!socket.connected) {
                    console.warn(`⏱️ Timeout conectando a ${serviceName}`);
                    resolve(socket);
                }
            }, 5000);
        });
    }

    disconnect() {
        console.log('🔌 Disconnecting all WebSocket services...');
        Object.keys(this.sockets).forEach(key => {
            if (this.sockets[key]) {
                this.sockets[key].disconnect();
                this.sockets[key] = null;
            }
        });
        this.listeners.clear();
        this.isInitialized = false; // Allow reconnection after explicit disconnect
    }

    // Subscribe to stock updates (Inventory Service)
    onStockUpdate(callback) {
        // Use the already connected socket from connectAll
        if (!this.sockets.inventory) {
            console.error('❌ Inventory socket not initialized. Call connectAll() first.');
            return null;
        }

        const wrappedCallback = (data) => {
            console.log('📦 Actualización de stock recibida:', data);
            callback(data);
        };

        this.sockets.inventory.on('stockUpdate', wrappedCallback);
        
        const listenerId = `stockUpdate_${Date.now()}`;
        this.listeners.set(listenerId, { socket: 'inventory', event: 'stockUpdate', callback: wrappedCallback });
        
        return listenerId;
    }

    offStockUpdate(listenerId) {
        const listener = this.listeners.get(listenerId);
        if (listener && this.sockets[listener.socket]) {
            this.sockets[listener.socket].off(listener.event, listener.callback);
            this.listeners.delete(listenerId);
        }
    }

    // Generic method to listen to any event on any service
    on(serviceName, eventName, callback) {
        const socket = this.sockets[serviceName];
        if (!socket) {
            console.warn(`Socket ${serviceName} no disponible`);
            return null;
        }

        socket.on(eventName, callback);
        
        const listenerId = `${serviceName}_${eventName}_${Date.now()}`;
        this.listeners.set(listenerId, { socket: serviceName, event: eventName, callback });
        
        return listenerId;
    }

    off(listenerId) {
        const listener = this.listeners.get(listenerId);
        if (listener && this.sockets[listener.socket]) {
            this.sockets[listener.socket].off(listener.event, listener.callback);
            this.listeners.delete(listenerId);
        }
    }

    removeAllListeners(serviceName, event) {
        const socket = this.sockets[serviceName];
        if (socket) {
            socket.removeAllListeners(event);
        }
        // Clean up internal tracking
        for (const [key, value] of this.listeners.entries()) {
            if (value.socket === serviceName && value.event === event) {
                this.listeners.delete(key);
            }
        }
    }

    isConnected(serviceName = null) {
        if (serviceName) {
            // Check specific service
            return this.sockets[serviceName] && this.sockets[serviceName].connected;
        }
        // Check if all sockets are connected
        const services = ['inventory', 'crm', 'purchases', 'pos'];
        return services.every(service => this.sockets[service] && this.sockets[service].connected);
    }

    // Expose socket property for backwards compatibility
    get socket() {
        return this.sockets.inventory || this.sockets.pos || this.sockets.crm || this.sockets.purchases;
    }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
