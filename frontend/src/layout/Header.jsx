import React, { useState } from 'react';
import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationCenter from '../components/NotificationCenter';
import './Header.css';

const Header = () => {
    const { theme, toggleTheme, toggleSidebar } = useTheme();
    const { unreadCount } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);

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
                </div>
            </header>
            
            <NotificationCenter 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
            />
        </>
    );
};

export default Header;
