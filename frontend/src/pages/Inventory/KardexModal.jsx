import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
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
            const response = await fetch(`http://localhost:3001/api/inventory/kardex/${product.id}`);
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

    if (!product) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content kardex-modal">
                <div className="modal-header">
                    <h3>Kardex: {product.name}</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="kardex-summary">
                        <div className="summary-item">
                            <span className="label">Stock Actual:</span>
                            <span className="value">{product.stock}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Categoría:</span>
                            <span className="value">{product.category}</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading">Cargando movimientos...</div>
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
                                            <td colSpan="6" className="text-center">No hay movimientos registrados</td>
                                        </tr>
                                    ) : (
                                        movements.map((mov) => (
                                            <tr key={mov.id}>
                                                <td>{new Date(mov.timestamp).toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge ${mov.type.toLowerCase()}`}>
                                                        {mov.type}
                                                    </span>
                                                </td>
                                                <td>{mov.reference}</td>
                                                <td className={mov.quantity > 0 ? 'text-success' : 'text-danger'}>
                                                    {mov.quantity > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                                    {Math.abs(mov.quantity)}
                                                </td>
                                                <td>{mov.previousstock}</td>
                                                <td>{mov.newstock}</td>
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
