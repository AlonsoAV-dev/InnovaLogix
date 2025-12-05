import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { Calendar, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import axios from 'axios';
import './Reports.css';

import { ExportService } from '../../services/ExportService';

const SalesReports = () => {
    const [salesData, setSalesData] = useState([]);
    const [trendsData, setTrendsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('monthly');
    const [exportStatus, setExportStatus] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch sales data from reports service
                const [salesRes, trendsRes] = await Promise.all([
                    axios.get('http://localhost:3005/api/reports/sales'),
                    axios.get('http://localhost:3005/api/analytics/trends')
                ]);

                setSalesData(Array.isArray(salesRes.data) ? salesRes.data : []);
                setTrendsData(Array.isArray(trendsRes.data?.salesTrend) ? trendsRes.data.salesTrend : []);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching sales reports:", error);
                setSalesData([]);
                setTrendsData([]);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleExport = async () => {
        try {
            await ExportService.downloadReport(
                'http://localhost:3005/api/reports/export/sales',
                'Reporte_Ventas.pdf',
                setExportStatus
            );
            setTimeout(() => setExportStatus(''), 3000);
        } catch (error) {
            alert(error.message);
            setExportStatus('');
        }
    };

    if (loading) return <div className="loading">Cargando reportes...</div>;

    // Calculate totals - safely handle empty arrays
    const totalSales = Array.isArray(salesData) && salesData.length > 0 
        ? salesData.reduce((sum, item) => sum + (item.total || 0), 0) 
        : 0;
    const totalTx = Array.isArray(salesData) && salesData.length > 0 
        ? salesData.reduce((sum, item) => sum + (item.count || 0), 0) 
        : 0;
    const avgTicket = totalTx > 0 ? totalSales / totalTx : 0;

    return (
        <div className="report-view fade-in">
            <div className="report-header-actions">
                <h3>Reportes de Ventas</h3>
                <div className="filters">
                    <select value={period} onChange={(e) => setPeriod(e.target.value)} className="report-select">
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                        <option value="yearly">Anual</option>
                    </select>
                    <button
                        className="btn-export"
                        onClick={handleExport}
                        disabled={exportStatus && exportStatus !== 'Completado' && exportStatus !== 'Falló'}
                    >
                        {exportStatus || 'Exportar PDF'}
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon bg-blue-100 text-blue-600">
                        <DollarSign size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Ventas Totales</span>
                        <h4 className="kpi-value">${totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h4>
                        <span className="kpi-trend positive">↑ 12.5% vs mes anterior</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon bg-green-100 text-green-600">
                        <ShoppingCart size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Transacciones</span>
                        <h4 className="kpi-value">{totalTx}</h4>
                        <span className="kpi-trend negative">↓ 3.2% vs mes anterior</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon bg-purple-100 text-purple-600">
                        <TrendingUp size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Ticket Promedio</span>
                        <h4 className="kpi-value">${avgTicket.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h4>
                        <span className="kpi-trend positive">↑ 8.1% esta semana</span>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-container">
                <div className="chart-card full-width">
                    <h4>Tendencia de Ventas</h4>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={trendsData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="date" stroke="var(--color-text-muted)" />
                                <YAxis stroke="var(--color-text-muted)" />
                                <Tooltip
                                    formatter={(value) => [`$${value}`, 'Ventas']}
                                    contentStyle={{ 
                                        borderRadius: '8px', 
                                        border: 'none', 
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        backgroundColor: 'var(--color-bg-card)',
                                        color: 'var(--color-text-main)'
                                    }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#2E7D32" fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReports;
