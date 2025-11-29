import React, { useState } from 'react';
import { ShoppingBag, Users, History, TrendingUp, AlertTriangle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Button from '../../components/Button';
import SupplierList from './SupplierList';
import PurchaseForm from './PurchaseForm';
import SupplierHistory from './SupplierHistory';
import PriceComparison from './PriceComparison';
import RestockAlerts from './RestockAlerts';
import './Purchases.css';

const Purchases = () => {
    const [activeTab, setActiveTab] = useState('new'); // new, history, suppliers, comparison, alerts

    const handleOrderNow = (product) => {
        // Switch to new purchase tab (logic to pre-fill could be added here)
        setActiveTab('new');
        // Ideally we would pass the product to PurchaseForm, but for now just switching tabs
        alert(`Inicie una nueva compra para: ${product.name}`);
    };

    return (
        <div className="purchases-container">
            <div className="purchases-header">
                <h2 className="page-title">Gestión de Compras</h2>
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
                        onClick={() => setActiveTab('new')}
                        title="Nueva Compra"
                    >
                        <ShoppingBag size={18} /> <span className="tab-label">Nueva</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('suppliers')}
                        title="Proveedores"
                    >
                        <Users size={18} /> <span className="tab-label">Proveedores</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                        title="Historial"
                    >
                        <History size={18} /> <span className="tab-label">Historial</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
                        onClick={() => setActiveTab('comparison')}
                        title="Comparativa Precios"
                    >
                        <TrendingUp size={18} /> <span className="tab-label">Precios</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('alerts')}
                        title="Alertas Reposición"
                    >
                        <AlertTriangle size={18} /> <span className="tab-label">Alertas</span>
                    </button>
                </div>
            </div>

            <div className="purchases-content">
                {activeTab === 'new' && <PurchaseForm onComplete={() => setActiveTab('history')} />}
                {activeTab === 'suppliers' && <SupplierList />}
                {activeTab === 'history' && <SupplierHistory />}
                {activeTab === 'comparison' && <PriceComparison />}
                {activeTab === 'alerts' && <RestockAlerts onOrderNow={handleOrderNow} />}
            </div>
        </div>
    );
};

export default Purchases;
