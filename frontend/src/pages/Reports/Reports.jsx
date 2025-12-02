import React, { useState } from 'react';
import {
    BarChart3, Calendar, TrendingUp, Package, DollarSign,
    FileText, Settings, ChevronRight, ShieldCheck
} from 'lucide-react';
import SalesReports from './SalesReports';
import ProductAnalysis from './ProductAnalysis';
import InventoryReports from './InventoryReports';
import FinancialReports from './FinancialReports';
import AuditLogs from '../Audit/AuditLogs';
import './Reports.css';

const Reports = () => {
    const [activeModule, setActiveModule] = useState('sales');

    const menuItems = [
        { id: 'sales', label: 'Reportes de Ventas', icon: <BarChart3 size={20} /> },
        { id: 'products', label: 'Análisis de Productos', icon: <Package size={20} /> },
        { id: 'inventory', label: 'Gestión de Inventario', icon: <FileText size={20} /> },
        { id: 'financial', label: 'Reportes Financieros', icon: <DollarSign size={20} /> },
        { id: 'audit', label: 'Auditoría del Sistema', icon: <ShieldCheck size={20} /> },
    ];

    const renderContent = () => {
        switch (activeModule) {
            case 'sales': return <SalesReports />;
            case 'products': return <ProductAnalysis />;
            case 'inventory': return <InventoryReports />;
            case 'financial': return <FinancialReports />;
            case 'audit': return <AuditLogs />;
            default: return <SalesReports />;
        }
    };

    return (
        <div className="reports-layout">
            {/* Sidebar Navigation */}
            <div className="reports-sidebar">
                <div className="sidebar-header">
                    <h3>Módulos de Reportes</h3>
                </div>
                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
                            onClick={() => setActiveModule(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                            {activeModule === item.id && <ChevronRight size={16} className="nav-arrow" />}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="nav-item">
                        <span className="nav-icon"><Settings size={20} /></span>
                        <span className="nav-label">Configuración</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="reports-main">
                {renderContent()}
            </div>
        </div>
    );
};

export default Reports;
