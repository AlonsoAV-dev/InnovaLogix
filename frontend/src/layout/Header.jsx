import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, Sun, Moon, MessageCircle, LogOut, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socketService';
import NotificationCenter from '../components/NotificationCenter';
import SupportChat from '../components/SupportChat';
import SupportNotification from '../components/SupportNotification';
import './Header.css';

const Header = () => {
    const { theme, toggleTheme, toggleSidebar } = useTheme();
    const { unreadCount } = useNotifications();
    const { user, logout, isSupport } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSupportChat, setShowSupportChat] = useState(false);
    const [hasPendingRequests, setHasPendingRequests] = useState(false);
    const [currentNotification, setCurrentNotification] = useState(null);

    useEffect(() => {
        if (!isSupport()) return;

        const setupListener = () => {
            const crmSocket = socketService.sockets.crm;
            if (!crmSocket) return;

            const handleNewRequest = (data) => {
                console.log('🔔 Nueva solicitud de soporte:', data);
                setHasPendingRequests(true);
                
                // Mostrar notificación visual personalizada
                setCurrentNotification({
                    clientName: data.clientName,
                    timestamp: new Date()
                });
            };

            crmSocket.on('nueva_solicitud', handleNewRequest);

            return () => {
                crmSocket.off('nueva_solicitud', handleNewRequest);
            };
        };

        // Si el socket ya está conectado, configurar listener
        const crmSocket = socketService.sockets.crm;
        if (crmSocket?.connected) {
            return setupListener();
        }

        // Si no está conectado, esperar a que se conecte
        if (crmSocket) {
            const onConnect = () => {
                console.log('🔌 CRM socket conectado, configurando listener de soporte');
            };
            crmSocket.on('connect', onConnect);
            const cleanup = setupListener();
            
            return () => {
                crmSocket.off('connect', onConnect);
                if (cleanup) cleanup();
            };
        }
    }, [isSupport]);

    const handleChatClick = () => {
        setHasPendingRequests(false);
        setCurrentNotification(null);
        setShowSupportChat(!showSupportChat);
    };

    const handleNotificationOpen = () => {
        setShowSupportChat(true);
    };

    const handleNotificationClose = () => {
        setCurrentNotification(null);
    };

    return (
        <>
            <header className="header">
                <div className="header-left">
                    <button className="icon-button menu-button" onClick={toggleSidebar} title="Toggle Sidebar">
                        <Menu size={20} />
                    </button>
                    <div className="header-search">
                        <Search size={20} className="search-icon" />
                        <input type="text" placeholder="Buscar..." className="search-input" />
                    </div>
                </div>

                <div className="header-actions">
                    <div className="user-info">
                        <User size={16} />
                        <span>{user?.name}</span>
                        <span className="user-role-badge">{user?.role}</span>
                    </div>
                    <button className="icon-button" onClick={toggleTheme} title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button 
                        className="icon-button" 
                        onClick={() => setShowNotifications(!showNotifications)}
                        title="Notificaciones"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        )}
                    </button>
                    <button 
                        className="icon-button" 
                        onClick={handleChatClick}
                        title="Soporte en vivo"
                        style={{ position: 'relative' }}
                    >
                        <MessageCircle size={20} />
                        {hasPendingRequests && (
                            <span className="notification-badge"></span>
                        )}
                    </button>
                    <button 
                        className="icon-button logout-button" 
                        onClick={logout}
                        title="Cerrar sesión"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>
            
            <NotificationCenter 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
            />
            
            <SupportChat 
                isOpen={showSupportChat} 
                onClose={() => setShowSupportChat(false)} 
            />

            <SupportNotification
                show={currentNotification !== null}
                clientName={currentNotification?.clientName}
                onClose={handleNotificationClose}
                onOpen={handleNotificationOpen}
            />
        </>
    );
};

export default Header;
