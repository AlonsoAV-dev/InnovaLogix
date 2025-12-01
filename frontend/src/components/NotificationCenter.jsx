import React, { useState, useRef, useEffect } from 'react';
import { X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
    const { notifications, markAsRead, markAllAsRead, clearAll, removeNotification } = useNotifications();
    const panelRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is on the notification button itself (by checking for Bell icon or notification-badge)
            const isNotificationButton = event.target.closest('.icon-button[title="Notificaciones"]') || 
                                        event.target.closest('button[title="Notificaciones"]');
            
            if (isNotificationButton) {
                return; // Don't close if clicking the notification button
            }
            
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            // Use setTimeout to avoid closing immediately on the same click that opened it
            setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 0);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getNotificationStyle = (type) => {
        const styles = {
            success: 'notification-success',
            error: 'notification-error',
            warning: 'notification-warning',
            info: 'notification-info'
        };
        return styles[type] || 'notification-info';
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return date.toLocaleDateString('es-PE');
    };

    return (
        <div className="notification-panel" ref={panelRef}>
            <div className="notification-header">
                <h3>Notificaciones</h3>
                <div className="notification-actions">
                    {notifications.length > 0 && (
                        <>
                            <button 
                                className="icon-button-small" 
                                onClick={markAllAsRead}
                                title="Marcar todas como leídas"
                            >
                                <CheckCheck size={16} />
                            </button>
                            <button 
                                className="icon-button-small" 
                                onClick={clearAll}
                                title="Limpiar todo"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                    <button className="icon-button-small" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="notification-list">
                {notifications.length === 0 ? (
                    <div className="notification-empty">
                        <span className="empty-icon">🔔</span>
                        <p>No hay notificaciones</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div 
                            key={notification.id} 
                            className={`notification-item ${getNotificationStyle(notification.type)} ${notification.read ? 'read' : 'unread'}`}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                            <div className="notification-icon">
                                {notification.icon || '🔔'}
                            </div>
                            <div className="notification-content">
                                <div className="notification-title">
                                    {notification.title}
                                    {!notification.read && <span className="unread-dot"></span>}
                                </div>
                                <div className="notification-message">{notification.message}</div>
                                <div className="notification-time">{formatTime(notification.timestamp)}</div>
                            </div>
                            <button 
                                className="notification-remove"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;
