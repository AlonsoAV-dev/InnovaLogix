import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Percent } from 'lucide-react';
import axios from 'axios';
import './Reports.css';

import { ExportService } from '../../services/ExportService';

const FinancialReports = () => {
    const [financialData, setFinancialData] = useState(null);
    const [promoData, setPromoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportStatus, setExportStatus] = useState('');

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [finRes, promoRes] = await Promise.all([
                    axios.get('http://localhost:3005/api/reports/financial/net-profit'),
                    axios.get('http://localhost:3005/api/reports/financial/promotions')
                ]);
                setFinancialData(finRes.data);
                setPromoData(promoRes.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching financial reports:", error);
                setError("No se pudieron cargar los reportes. Asegúrese de que el servicio de reportes esté activo.");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleExport = async () => {
        try {
            await ExportService.downloadReport(
                'http://localhost:3005/api/reports/export/financial',
                'Reporte_Financiero.pdf',
                setExportStatus
            );
            setTimeout(() => setExportStatus(''), 3000);
        } catch (error) {
            alert(error.message);
            setExportStatus('');
        }
    };

    if (loading) return <div className="loading">Cargando finanzas...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!financialData || !financialData.summary) return <div className="error-message">Datos no disponibles</div>;

    return (
        <div className="report-view fade-in">
            <div className="report-header-actions">
                <h3>Reportes Financieros</h3>
                <button
                    className="btn-export"
                    onClick={handleExport}
                    disabled={exportStatus && exportStatus !== 'Completado' && exportStatus !== 'Falló'}
                >
                    {exportStatus || 'Exportar PDF'}
                </button>
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon bg-green-100 text-green-600">
                        <DollarSign size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Ganancia Neta</span>
                        <h4 className="kpi-value">${financialData.summary.totalProfit}</h4>
                        <span className="kpi-trend positive">↑ 15.4% vs trimestre anterior</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon bg-blue-100 text-blue-600">
                        <TrendingUp size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Margen de Ganancia</span>
                        <h4 className="kpi-value">{financialData.summary.margin}</h4>
                        <span className="kpi-trend positive">↑ 3.1% vs año anterior</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon bg-purple-100 text-purple-600">
                        <Percent size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">ROI Promociones</span>
                        <h4 className="kpi-value">{promoData.roi}</h4>
                    </div>
                </div>
            </div>

            {/* Net Profit Chart */}
            <div className="chart-card full-width">
                <h4>Ganancia Neta por Mes</h4>
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={financialData.monthly}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip
                                formatter={(value) => [`$${value}`, 'Ganancia']}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Promotions Analysis */}
            <div className="chart-card full-width mt-4">
                <h4>Análisis de Promociones</h4>
                <div className="p-4">
                    <p className="text-gray-600">
                        Las promociones activas han generado un ingreso adicional de
                        <span className="font-bold text-green-600"> ${promoData.revenueGenerated}</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FinancialReports;
