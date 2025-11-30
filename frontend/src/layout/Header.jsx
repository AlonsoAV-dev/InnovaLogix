import React from 'react';
import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Header.css';

const Header = () => {
    const { theme, toggleTheme, toggleSidebar } = useTheme();

    return (
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
                <button className="icon-button">
                    <Bell size={20} />
                    <span className="notification-badge">3</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
