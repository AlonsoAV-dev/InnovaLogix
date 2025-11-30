import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Add notification
    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Auto-remove after 10 seconds if it's a toast
        if (notification.autoRemove !== false) {
            setTimeout(() => {
                removeNotification(newNotification.id);
            }, 10000);
        }
    }, []);

    // Remove notification
    const removeNotification = useCallback((id) => {
        setNotifications(prev => {
            const notification = prev.find(n => n.id === id);
            if (notification && !notification.read) {
                setUnreadCount(count => Math.max(0, count - 1));
            }
            return prev.filter(n => n.id !== id);
        });
    }, []);

    // Mark as read
    const markAsRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => {
            if (n.id === id && !n.read) {
                setUnreadCount(count => Math.max(0, count - 1));
                return { ...n, read: true };
            }
            return n;
        }));
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }, []);

    // Clear all notifications
    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // Setup WebSocket listeners (connection already initialized in App.jsx)
    useEffect(() => {
        // Inventory notifications
        const inventoryListener = socketService.onStockUpdate((data) => {
            const { action, productName, stock, minStock } = data;
            
            if (action === 'created') {
                addNotification({
                    type: 'success',
                    category: 'inventory',
                    title: 'Producto Creado',
                    message: `${productName} ha sido agregado al inventario`,
                    icon: '📦'
                });
            } else if (action === 'updated') {
                addNotification({
                    type: 'info',
                    category: 'inventory',
                    title: 'Stock Actualizado',
                    message: `${productName}: ${stock} unidades disponibles`,
                    icon: '📊'
                });
            } else if (action === 'low_stock' || (minStock && stock <= minStock)) {
                addNotification({
                    type: 'warning',
                    category: 'inventory',
                    title: 'Stock Bajo',
                    message: `${productName} tiene solo ${stock} unidades`,
                    icon: '⚠️',
                    autoRemove: false
                });
            }
        });

        // POS notifications
        const posListeners = [];
        posListeners.push(socketService.on('pos', 'saleCompleted', (data) => {
            addNotification({
                type: 'success',
                category: 'pos',
                title: 'Venta Completada',
                message: `Venta #${data.saleId} por S/ ${data.total?.toFixed(2)}`,
                icon: '💰'
            });
        }));

        // Purchase notifications
        posListeners.push(socketService.on('purchases', 'purchaseCreated', (data) => {
            addNotification({
                type: 'info',
                category: 'purchases',
                title: 'Nueva Compra',
                message: `Compra #${data.purchaseId} creada - ${data.supplierName}`,
                icon: '🛒'
            });
        }));

        posListeners.push(socketService.on('purchases', 'purchaseConfirmed', (data) => {
            addNotification({
                type: 'success',
                category: 'purchases',
                title: 'Compra Confirmada',
                message: `Compra #${data.purchaseId} confirmada y stock actualizado`,
                icon: '✅'
            });
        }));

        posListeners.push(socketService.on('purchases', 'purchaseCancelled', (data) => {
            addNotification({
                type: 'error',
                category: 'purchases',
                title: 'Compra Cancelada',
                message: `Compra #${data.purchaseId} ha sido cancelada`,
                icon: '❌'
            });
        }));

        // CRM notifications
        posListeners.push(socketService.on('crm', 'newCustomer', (data) => {
            addNotification({
                type: 'success',
                category: 'crm',
                title: 'Nuevo Cliente',
                message: `${data.customerName} registrado en el sistema`,
                icon: '👤'
            });
        }));

        posListeners.push(socketService.on('crm', 'newClaim', (data) => {
            addNotification({
                type: 'warning',
                category: 'crm',
                title: 'Nuevo Reclamo',
                message: `Reclamo #${data.claimId} de ${data.customerName}`,
                icon: '📢',
                autoRemove: false
            });
        }));

        // System notifications
        posListeners.push(socketService.on('inventory', 'systemAlert', (data) => {
            addNotification({
                type: data.severity || 'info',
                category: 'system',
                title: data.title || 'Alerta del Sistema',
                message: data.message,
                icon: '🔔',
                autoRemove: false
            });
        }));

        // Cleanup
        return () => {
            socketService.offStockUpdate(inventoryListener);
            posListeners.forEach(id => {
                if (id) socketService.off(id);
            });
        };
    }, [addNotification]);

    const value = {
        notifications,
        unreadCount,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
