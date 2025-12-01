import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Package } from 'lucide-react';
import './KardexModal.css';

const KardexModal = ({ product, onClose }) => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (product) {
            fetchKardex();
        }
    }, [product]);

    const fetchKardex = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/inventory/movements?productId=${product.id}`);
            if (response.ok) {
                const data = await response.json();
                setMovements(data);
            }
        } catch (error) {
            console.error("Error fetching kardex:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year}, ${hours}:${minutes} p. m.`;
    };

    const getTypeLabel = (type) => {
        const types = {
            'SALE': 'Sale',
            'INIT': 'Init',
            'ADJUSTMENT': 'Adjustment',
            'PURCHASE_CONFIRM': 'Purchase Confirm',
            'PURCHASE_CANCEL': 'Purchase Cancel'
        };
        return types[type] || type;
    };

    if (!product) return null;

    const totalEntries = movements.filter(m => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0);
    const totalExits = movements.filter(m => m.quantity < 0).reduce((sum, m) => sum + Math.abs(m.quantity), 0);

    return (
        <div className="modal-overlay">
            <div className="modal-content kardex-modal">
                <div className="modal-header">
                    <h3>{product.name}</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="kardex-summary">
                        <div className="summary-item">
                            <span className="label">Stock Actual</span>
                            <span className="value">
                                <Package size={24} />
                                {product.stock}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Categoría</span>
                            <span className="value">{product.category}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Total Entradas</span>
                            <span className="value">
                                <TrendingDown size={24} style={{ color: '#38ef7d' }} />
                                {totalEntries}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Total Salidas</span>
                            <span className="value">
                                <TrendingUp size={24} style={{ color: '#ee5a6f' }} />
                                {totalExits}
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading">Cargando movimientos</div>
                    ) : (
                        <div className="table-container">
                            <table className="kardex-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Referencia</th>
                                        <th>Entrada/Salida</th>
                                        <th>Stock Anterior</th>
                                        <th>Nuevo Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center">
                                                 No hay movimientos registrados
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.map((mov) => (
                                            <tr key={mov.id}>
                                                <td>{formatDate(mov.timestamp)}</td>
                                                <td>
                                                    <span className={`badge ${mov.type.toLowerCase()}`}>
                                                        {getTypeLabel(mov.type)}
                                                    </span>
                                                </td>
                                                <td>{mov.reference}</td>
                                                <td>
                                                    <div className={mov.quantity > 0 ? 'text-success' : 'text-danger'}>
                                                        {mov.quantity > 0 ? (
                                                            <>
                                                                <TrendingDown size={16} />
                                                                +{mov.quantity}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TrendingUp size={16} />
                                                                {mov.quantity}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{mov.previousstock}</td>
                                                <td><strong>{mov.newstock}</strong></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KardexModal;
