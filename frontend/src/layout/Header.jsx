import React from 'react';
import { Bell, Search } from 'lucide-react';
import './Header.css';

const Header = () => {
    return (
        <header className="header">
            <div className="header-search">
                <Search size={20} className="search-icon" />
                <input type="text" placeholder="Buscar..." className="search-input" />
            </div>

            <div className="header-actions">
                <button className="icon-button">
                    <Bell size={20} />
                    <span className="notification-badge">3</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
