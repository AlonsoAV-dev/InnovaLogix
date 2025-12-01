import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, ShoppingBag, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { user } = useAuth();
    const navItems = [
        { path: '/pos', label: 'Ventas', icon: ShoppingCart },
        { path: '/inventory', label: 'Inventario', icon: Package },
        { path: '/purchases', label: 'Compras', icon: ShoppingBag },
        { path: '/crm', label: 'Clientes', icon: Users },
        { path: '/reports', label: 'Reportes', icon: BarChart3 },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">
                    <LayoutDashboard size={24} color="var(--color-primary)" />
                </div>
                <h1 className="logo-text">InnovaLogix</h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="avatar">
                        {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{user?.name || 'Usuario'}</span>
                        <span className="user-role">
                            {user?.role === 'admin' ? 'Administrador' : 
                             user?.role === 'support' ? 'Soporte' : 'Usuario'}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
