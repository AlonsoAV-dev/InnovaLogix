import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Trash2, AlertTriangle, Wifi, WifiOff, FileText, Bell, X } from 'lucide-react';
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
    const [showAlerts, setShowAlerts] = useState(true);

    useEffect(() => {
        // Check connection status
        setIsConnected(socketService.isConnected('inventory'));

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
            setIsConnected(socketService.isConnected('inventory'));
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
            const res = await fetch('http://localhost:3000/api/alerts');
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

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
            try {
                const res = await fetch(`http://localhost:3000/api/products/${id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    setProducts(prev => prev.filter(p => p.id !== id));
                    alert('Producto eliminado correctamente');
                } else {
                    alert('Error al eliminar el producto');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Error al eliminar el producto');
            }
        }
    };

    const handleSave = async (product) => {
        try {
            if (editingProduct) {
                // Editar producto existente
                const res = await fetch(`http://localhost:3000/api/products/${product.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: product.name,
                        price: product.price,
                        cost: product.cost,
                        stock: product.stock,
                        minStock: product.minStock || 5,
                        category: product.category,
                        image: product.image || ''
                    })
                });
                
                if (res.ok) {
                    const updatedProduct = await res.json();
                    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? {
                        ...updatedProduct,
                        price: parseFloat(updatedProduct.price),
                        cost: parseFloat(updatedProduct.cost),
                        stock: parseInt(updatedProduct.stock),
                        minstock: parseInt(updatedProduct.minstock)
                    } : p));
                    setIsModalOpen(false);
                    setEditingProduct(null);
                } else {
                    const error = await res.json();
                    alert('Error al actualizar el producto: ' + (error.error || 'Error desconocido'));
                }
            } else {
                // Crear nuevo producto
                const res = await fetch('http://localhost:3000/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: product.name,
                        price: product.price,
                        cost: product.cost,
                        stock: product.stock,
                        minStock: product.minStock || 5,
                        category: product.category,
                        image: product.image || ''
                    })
                });
                
                if (res.ok) {
                    const newProduct = await res.json();
                    setProducts(prev => [...prev, {
                        ...newProduct,
                        price: parseFloat(newProduct.price),
                        cost: parseFloat(newProduct.cost),
                        stock: parseInt(newProduct.stock),
                        minstock: parseInt(newProduct.minstock)
                    }]);
                    setIsModalOpen(false);
                    setEditingProduct(null);
                } else {
                    const error = await res.json();
                    alert('Error al crear el producto: ' + (error.error || 'Error desconocido'));
                }
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error al guardar el producto: ' + error.message);
        }
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
            {showAlerts && alerts.length > 0 && (
                <div className="alerts-section">
                    <div className="alerts-header">
                        <h3 className="alerts-title">
                            <Bell size={16} /> Alertas de Reposición ({alerts.length})
                        </h3>
                        <button className="alerts-close-btn" onClick={() => setShowAlerts(false)} title="Cerrar alertas">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="alerts-grid">
                        {alerts.map(alert => (
                            <div key={alert.id} className="alert-card">
                                <div className="alert-header">
                                    <span className="alert-product">{alert.name}</span>
                                    <span className="alert-badge">Stock Crítico</span>
                                </div>
                                <div className="alert-details">
                                    <p>Stock Actual: <strong>{alert.stock}</strong></p>
                                    <p>Mínimo: <strong>{alert.minstock}</strong></p>
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
