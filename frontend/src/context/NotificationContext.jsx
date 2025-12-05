import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import notificationApi from '../services/notificationApi';

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
    const [isLoading, setIsLoading] = useState(true);

    // Load persisted notifications from database on mount
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                console.log('📥 Loading persisted notifications from database...');
                const persistedNotifications = await notificationApi.getAll(undefined, 50);
                
                // Convert database format to frontend format
                const formattedNotifications = persistedNotifications.map(notif => ({
                    id: notif.id,
                    type: notif.type,
                    category: notif.category,
                    title: notif.title,
                    message: notif.message,
                    read: notif.read,
                    timestamp: notif.createdat,
                    metadata: notif.metadata,
                    isPersisted: true, // Mark as from database
                    autoRemove: false // Don't auto-remove persisted notifications
                }));
                
                setNotifications(formattedNotifications);
                setUnreadCount(formattedNotifications.filter(n => !n.read).length);
                console.log(`✅ Loaded ${formattedNotifications.length} notifications (${formattedNotifications.filter(n => !n.read).length} unread)`);
            } catch (error) {
                console.error('❌ Error loading notifications:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadNotifications();
    }, []);

    // Reload notifications from database
    const reloadNotifications = useCallback(async () => {
        try {
            const persistedNotifications = await notificationApi.getAll(undefined, 50);
            const formattedNotifications = persistedNotifications.map(notif => ({
                id: notif.id,
                type: notif.type,
                category: notif.category,
                title: notif.title,
                message: notif.message,
                read: notif.read,
                timestamp: notif.createdat,
                metadata: notif.metadata,
                isPersisted: true,
                autoRemove: false
            }));
            
            setNotifications(formattedNotifications);
            setUnreadCount(formattedNotifications.filter(n => !n.read).length);
        } catch (error) {
            console.error('❌ Error reloading notifications:', error);
        }
    }, []);

    // Add notification (only for temporary toasts, persisted ones reload from DB)
    const addNotification = useCallback((notification) => {
        // If it's a persisted notification event (from WebSocket), reload from DB instead
        if (notification.isPersisted !== false) {
            console.log('🔄 Nueva notificación persistida, recargando desde BD...');
            reloadNotifications();
            return;
        }

        // Otherwise add as temporary toast
        const newNotification = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            read: false,
            isPersisted: false,
            ...notification
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Auto-remove temporary notifications after 10 seconds
        setTimeout(() => {
            removeNotification(newNotification.id);
        }, 10000);
    }, [reloadNotifications]);

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
    const markAsRead = useCallback(async (id) => {
        const notification = notifications.find(n => n.id === id);
        
        // If it's a persisted notification, update in database
        if (notification && notification.isPersisted) {
            try {
                await notificationApi.markAsRead(id);
            } catch (error) {
                console.error('❌ Error marking notification as read:', error);
            }
        }
        
        setNotifications(prev => prev.map(n => {
            if (n.id === id && !n.read) {
                setUnreadCount(count => Math.max(0, count - 1));
                return { ...n, read: true };
            }
            return n;
        }));
    }, [notifications]);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('❌ Error marking all notifications as read:', error);
        }
    }, []);

    // Clear all notifications
    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // Setup WebSocket listeners (connection already initialized in App.jsx)
    useEffect(() => {
        console.log('🔔 Configurando listeners de notificaciones...');

        // Inventory notifications
        const inventorySocket = socketService.sockets.inventory;
        if (inventorySocket) {
            inventorySocket.on('stockUpdate', (data) => {
                console.log('📦 Evento stockUpdate recibido:', data);
                reloadNotifications();
            });
        }

        // POS notifications
        const posListeners = [];
        posListeners.push(socketService.on('pos', 'saleCompleted', (data) => {
            console.log('💰 Evento saleCompleted recibido:', data);
            reloadNotifications();
        }));

        // Purchase notifications
        posListeners.push(socketService.on('purchases', 'purchaseCreated', (data) => {
            console.log('🛒 Evento purchaseCreated recibido:', data);
            reloadNotifications();
        }));

        posListeners.push(socketService.on('purchases', 'purchaseConfirmed', (data) => {
            console.log('✅ Evento purchaseConfirmed recibido:', data);
            reloadNotifications();
        }));

        posListeners.push(socketService.on('purchases', 'purchaseCancelled', (data) => {
            console.log('❌ Evento purchaseCancelled recibido:', data);
            reloadNotifications();
        }));

        // CRM notifications
        posListeners.push(socketService.on('crm', 'newCustomer', (data) => {
            console.log('👤 Evento newCustomer recibido:', data);
            reloadNotifications();
        }));

        posListeners.push(socketService.on('crm', 'newClaim', (data) => {
            console.log('📢 Evento newClaim recibido:', data);
            reloadNotifications();
        }));

        console.log('✅ Listeners registrados correctamente');

        // Cleanup
        return () => {
            if (inventorySocket) {
                inventorySocket.off('stockUpdate');
            }
            posListeners.forEach(id => {
                if (id) socketService.off(id);
            });
        };
    }, [reloadNotifications]);

    const value = {
        notifications,
        unreadCount,
        isLoading,
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
