import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Trash2, AlertTriangle, Wifi, WifiOff, FileText, Bell } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import socketService from '../../services/socketService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ProductModal from './ProductModal';
import KardexModal from './KardexModal';
import './Inventory.css';

const Inventory = () => {
    const { products, setProducts } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [realtimeUpdates, setRealtimeUpdates] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Check connection status
        setIsConnected(socketService.isConnected());

        // Listen for real-time stock updates
        const listenerId = socketService.onStockUpdate((data) => {
            // Add visual notification of update
            const notificationId = Date.now();
            setRealtimeUpdates(prev => [...prev, {
                id: notificationId,
                productName: data.productName,
                action: data.action,
                stock: data.stock
            }]);

            // Remove notification after 5 seconds
            setTimeout(() => {
                setRealtimeUpdates(prev => prev.filter(u => u.id !== notificationId));
            }, 5000);
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

    // Kardex & Alerts State
    const [isKardexOpen, setIsKardexOpen] = useState(false);
    const [kardexProduct, setKardexProduct] = useState(null);
    const [alerts, setAlerts] = useState([]);

    React.useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/inventory/alerts');
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (error) {
            console.error("Error fetching alerts:", error);
        }
    };

    const handleOpenKardex = (product) => {
        setKardexProduct(product);
        setIsKardexOpen(true);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
            setProducts(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleSave = (product) => {
        if (editingProduct) {
            setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        } else {
            setProducts(prev => [...prev, { ...product, id: Date.now() }]);
        }
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    return (
        <div className="inventory-container">
            <div className="inventory-header">
                <h2 className="page-title">
                    Gestión de Inventario
                    <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                        {isConnected ? 'Tiempo Real' : 'Desconectado'}
                    </span>
                </h2>
                <div className="header-actions">
                    <div className="search-wrapper">
                        <Input
                            placeholder="Buscar por nombre o categoría..."
                            icon={Search}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button icon={Plus} onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>
                        Nuevo Producto
                    </Button>
                </div>
            </div>

            {/* Real-time updates notifications */}
            <div className="realtime-notifications">
                {realtimeUpdates.slice(-3).map(update => (
                    <div key={update.id} className="realtime-notification">
                        🔄 <strong>{update.productName}</strong> - Stock actualizado a {update.stock} unidades
                        {update.action === 'sale' && ' (Venta realizada)'}
                        {update.action === 'purchase' && ' (Compra confirmada)'}
                    </div>
                ))}
            </div>
            {/* INV-01: Alerts Dashboard */}
            {alerts.length > 0 && (
                <div className="alerts-section">
                    <h3 className="alerts-title"><Bell size={18} /> Alertas de Reposición (Dinámicas)</h3>
                    <div className="alerts-grid">
                        {alerts.map(alert => (
                            <div key={alert.id} className="alert-card">
                                <div className="alert-header">
                                    <span className="alert-product">{alert.name}</span>
                                    <span className="alert-badge">Stock Crítico</span>
                                </div>
                                <div className="alert-details">
                                    <p>Stock Actual: <strong>{alert.stock}</strong></p>
                                    <p>Ventas Diarias (30d): <strong>{alert.avgDailySales}</strong></p>
                                    <p>Mínimo Dinámico: <strong>{alert.dynamicMinStock}</strong></p>
                                    <div className="alert-suggestion">
                                        Sugerencia: Pedir <strong>{alert.suggestedReorder}</strong> un.
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="inventory-table-container">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id}>
                                <td className="product-cell">
                                    <div className="product-name-wrapper">
                                        <span className="product-name">{product.name}</span>
                                    </div>
                                </td>
                                <td>{product.category}</td>
                                <td>S/ {product.price.toFixed(2)}</td>
                                <td>
                                    <span className={`stock-badge ${product.stock < 10 ? 'low-stock' : 'in-stock'}`}>
                                        {product.stock} un.
                                    </span>
                                </td>
                                <td>
                                    {product.stock < 10 ? (
                                        <span className="status-text warning">
                                            <AlertTriangle size={14} /> Stock Bajo
                                        </span>
                                    ) : (
                                        <span className="status-text success">Disponible</span>
                                    )}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="icon-btn edit" onClick={() => handleEdit(product)}>
                                            <Edit size={18} />
                                        </button>
                                        <button className="icon-btn kardex" onClick={() => handleOpenKardex(product)} title="Ver Kardex">
                                            <FileText size={18} />
                                        </button>
                                        <button className="icon-btn delete" onClick={() => handleDelete(product.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={editingProduct}
                onSave={handleSave}
            />

            {isKardexOpen && (
                <KardexModal
                    product={kardexProduct}
                    onClose={() => setIsKardexOpen(false)}
                />
            )}
        </div>
    );
};

export default Inventory;
