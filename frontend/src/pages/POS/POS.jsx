import React, { useState, useEffect } from 'react';
import { Search, Filter, Wifi, WifiOff } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import socketService from '../../services/socketService';
import ProductGrid from './ProductGrid';
import CartSection from './CartSection';
import CheckoutModal from './CheckoutModal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import './POS.css';

const POS = () => {
    const { products, loading } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [stockAlerts, setStockAlerts] = useState([]);

    useEffect(() => {
        // Check connection status
        setIsConnected(socketService.isConnected());

        // Listen for real-time stock updates
        const listenerId = socketService.onStockUpdate((data) => {
            // Show alert if stock is critically low
            if (data.stock <= 5 && data.action === 'sale') {
                const alertId = Date.now();
                setStockAlerts(prev => [...prev, {
                    id: alertId,
                    productName: data.productName,
                    stock: data.stock
                }]);

                // Remove alert after 7 seconds
                setTimeout(() => {
                    setStockAlerts(prev => prev.filter(a => a.id !== alertId));
                }, 7000);
            }
        });

        // Check connection periodically
        const connectionCheck = setInterval(() => {
            setIsConnected(socketService.isConnected());
        }, 3000);

        return () => {
            socketService.offStockUpdate(listenerId);
            clearInterval(connectionCheck);
        };
    }, []);

    const categories = ['Todos', ...new Set(products.map(p => p.category))];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="pos-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                    <div>Cargando productos...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="pos-container">
            {/* Real-time stock alerts */}
            <div className="stock-alerts">
                {stockAlerts.slice(-2).map(alert => (
                    <div key={alert.id} className="stock-alert warning">
                        ⚠️ <strong>{alert.productName}</strong> - Stock crítico: {alert.stock} unidades restantes
                    </div>
                ))}
            </div>

            <div className="pos-main">
                <div className="pos-header">
                    <div className="pos-header-top">
                        <div className="pos-search">
                            <Input
                                placeholder="Buscar productos..."
                                icon={Search}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                fullWidth
                            />
                        </div>
                        <div className={`pos-connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                            {isConnected ? 'En línea' : 'Sin conexión'}
                        </div>
                    </div>
                    <div className="pos-filters">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    <ProductGrid products={filteredProducts} />
                </div>
            </div>

            <div className="pos-sidebar">
                <CartSection onCheckout={() => setIsCheckoutOpen(true)} />
            </div>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
            />
        </div>
    );
};

export default POS;
