import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Calendar, Search, FileText } from 'lucide-react';
import Input from '../../components/Input';
import './SupplierHistory.css';

const SupplierHistory = () => {
    const { purchases, suppliers, updatePurchaseStatus } = useStore();
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const filteredPurchases = purchases.filter(p => {
        const matchesSupplier = selectedSupplier ? p.supplierId === parseInt(selectedSupplier) : true;
        const matchesDate = dateFilter ? p.date.startsWith(dateFilter) : true;
        return matchesSupplier && matchesDate;
    });

    return (
        <div className="supplier-history">
            <div className="filters-bar">
                <div className="filter-group">
                    <label>Proveedor</label>
                    <select
                        value={selectedSupplier}
                        onChange={e => setSelectedSupplier(e.target.value)}
                        className="custom-select"
                    >
                        <option value="">Todos los proveedores</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Fecha</label>
                    <Input
                        type="date"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        icon={Calendar}
                    />
                </div>
            </div>

            <div className="history-list">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Factura</th>
                            <th>Fecha</th>
                            <th>Proveedor</th>
                            <th>Estado</th>
                            <th>Total</th>
                            <th>Items</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPurchases.map(purchase => (
                            <tr key={purchase.id}>
                                <td className="invoice-cell">
                                    <FileText size={14} />
                                    {purchase.invoiceNumber || 'N/A'}
                                </td>
                                <td>{new Date(purchase.date).toLocaleDateString()}</td>
                                <td>{purchase.supplierName}</td>
                                <td>
                                    <span className={`status-badge ${purchase.status.toLowerCase()}`}>
                                        {purchase.status}
                                    </span>
                                    {purchase.status === 'Pending' && (
                                        <button
                                            className="action-btn confirm-btn"
                                            onClick={() => updatePurchaseStatus(purchase.id, 'Confirmed')}
                                            title="Confirmar Recepción"
                                            style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '0.8em', cursor: 'pointer' }}
                                        >
                                            Confirmar
                                        </button>
                                    )}
                                </td>
                                <td>S/ {purchase.total.toFixed(2)}</td>
                                <td>{purchase.items.length} items</td>
                            </tr>
                        ))}
                        {filteredPurchases.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center text-muted">
                                    No se encontraron registros
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SupplierHistory;
