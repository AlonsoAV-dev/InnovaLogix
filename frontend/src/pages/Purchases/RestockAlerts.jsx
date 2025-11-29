import React from 'react';
import { useStore } from '../../context/StoreContext';
import { AlertTriangle, ShoppingCart } from 'lucide-react';
import Button from '../../components/Button';
import './RestockAlerts.css';

const RestockAlerts = ({ onOrderNow }) => {
    const { products } = useStore();

    const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 10));

    return (
        <div className="restock-alerts">
            <div className="alerts-header">
                <h3>Alertas de Reposición</h3>
                <span className="alert-count">{lowStockProducts.length} productos requieren atención</span>
            </div>

            <div className="alerts-grid">
                {lowStockProducts.map(product => (
                    <div key={product.id} className="alert-card">
                        <div className="alert-icon">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="alert-content">
                            <h4>{product.name}</h4>
                            <div className="stock-info">
                                <span className="current-stock">Stock: {product.stock}</span>
                                <span className="min-stock">Mínimo: {product.minStock || 10}</span>
                            </div>
                            <div className="stock-bar-container">
                                <div
                                    className="stock-bar"
                                    style={{ width: `${Math.min((product.stock / (product.minStock || 10)) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="alert-actions">
                            <Button
                                size="sm"
                                icon={ShoppingCart}
                                onClick={() => onOrderNow(product)}
                            >
                                Pedir
                            </Button>
                        </div>
                    </div>
                ))}

                {lowStockProducts.length === 0 && (
                    <div className="all-good-state">
                        <div className="check-circle">✓</div>
                        <p>Todo el inventario está en niveles óptimos</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestockAlerts;
