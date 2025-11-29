import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { DollarSign, ShoppingBag, CreditCard } from 'lucide-react';
import './SalesOverview.css';

const SalesOverview = () => {
    const { sales } = useStore();
    const [period, setPeriod] = useState('monthly'); // daily, weekly, monthly

    // Calculate totals
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalOrders = sales.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Filter sales based on period (mock logic for demo)
    const filteredSales = sales; // In a real app, filter by date range

    return (
        <div className="sales-overview">
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon money">
                        <DollarSign size={24} />
                    </div>
                    <div className="metric-info">
                        <h3>S/ {totalSales.toFixed(2)}</h3>
                        <p>Ventas Totales</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon orders">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="metric-info">
                        <h3>{totalOrders}</h3>
                        <p>Total Pedidos</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon ticket">
                        <CreditCard size={24} />
                    </div>
                    <div className="metric-info">
                        <h3>S/ {avgTicket.toFixed(2)}</h3>
                        <p>Ticket Promedio</p>
                    </div>
                </div>
            </div>

            <div className="sales-list-section">
                <div className="section-header">
                    <h3>Detalle de Ventas</h3>
                    <div className="period-toggle">
                        <button
                            className={period === 'daily' ? 'active' : ''}
                            onClick={() => setPeriod('daily')}
                        >
                            Diario
                        </button>
                        <button
                            className={period === 'weekly' ? 'active' : ''}
                            onClick={() => setPeriod('weekly')}
                        >
                            Semanal
                        </button>
                        <button
                            className={period === 'monthly' ? 'active' : ''}
                            onClick={() => setPeriod('monthly')}
                        >
                            Mensual
                        </button>
                    </div>
                </div>

                <table className="sales-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>ID Venta</th>
                            <th>Método Pago</th>
                            <th>Items</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map(sale => (
                            <tr key={sale.id}>
                                <td>{new Date(sale.date).toLocaleDateString()}</td>
                                <td>#{sale.id.toString().slice(-6)}</td>
                                <td className="capitalize">{sale.paymentMethod}</td>
                                <td>{sale.items}</td>
                                <td>S/ {sale.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesOverview;
