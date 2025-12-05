import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Package, RefreshCw, Percent, Award } from 'lucide-react';
import axios from 'axios';
import './Reports.css';

import { ExportService } from '../../services/ExportService';

const ProductAnalysis = () => {
    const [ranking, setRanking] = useState([]);
    const [rotation, setRotation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportStatus, setExportStatus] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rankingRes, rotationRes] = await Promise.all([
                    axios.get('http://localhost:3005/api/reports/products/ranking'),
                    axios.get('http://localhost:3005/api/reports/products/rotation')
                ]);
                setRanking(Array.isArray(rankingRes.data) ? rankingRes.data : []);
                setRotation(Array.isArray(rotationRes.data) ? rotationRes.data : []);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching product reports:", error);
                setRanking([]);
                setRotation([]);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleExport = async () => {
        try {
            await ExportService.downloadReport(
                'http://localhost:3005/api/reports/export/products',
                'Analisis_Productos.pdf',
                setExportStatus
            );
            setTimeout(() => setExportStatus(''), 3000);
        } catch (error) {
            alert(error.message);
            setExportStatus('');
        }
    };

    if (loading) return <div className="loading">Cargando análisis...</div>;

    // KPI Calculations
    const activeProducts = Array.isArray(ranking) ? ranking.length : 0;
    const avgRotation = Array.isArray(rotation) && rotation.length > 0
        ? Math.round(rotation.reduce((sum, item) => sum + (item.rotationDays || 0), 0) / rotation.length)
        : 0;
    const avgMargin = Array.isArray(ranking) && ranking.length > 0
        ? (ranking.reduce((sum, item) => sum + parseFloat(item.margin || 0), 0) / ranking.length).toFixed(1)
        : 0;

    // Chart Data Preparation
    const categoryData = Array.isArray(ranking) ? ranking.reduce((acc, item) => {
        const cat = item.category || 'Otros';
        const existing = acc.find(x => x.name === cat);
        if (existing) {
            existing.value += parseFloat(item.revenue || 0);
        } else {
            acc.push({ name: cat, value: parseFloat(item.revenue || 0) });
        }
        return acc;
    }, []) : [];

    const COLORS = ['#2E7D32', '#4CAF50', '#FF6F00', '#FFC107', '#1B5E20'];

    return (
        <div className="report-view fade-in">
            <div className="report-header-actions">
                <h3>Análisis de Productos</h3>
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
                    <div className="kpi-icon bg-blue-100 text-blue-600">
                        <Package size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Productos Activos</span>
                        <h4 className="kpi-value">{activeProducts}</h4>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon bg-orange-100 text-orange-600">
                        <RefreshCw size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Rotación Promedio</span>
                        <h4 className="kpi-value">{avgRotation} días</h4>
                        <span className="kpi-trend negative">↓ 12.3% mejora</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon bg-green-100 text-green-600">
                        <Percent size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Margen Promedio</span>
                        <h4 className="kpi-value">{avgMargin}%</h4>
                        <span className="kpi-trend positive">↑ 2.8% vs trimestre anterior</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Ranking Table */}
                <div className="chart-card flex-2">
                    <h4>Ranking de Productos</h4>
                    <div className="table-container">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Unidades</th>
                                    <th>Ingresos</th>
                                    <th>Margen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.slice(0, 5).map((product, index) => (
                                    <tr key={product.id}>
                                        <td>{index + 1}</td>
                                        <td className="font-medium">{product.name}</td>
                                        <td><span className="badge">{product.category}</span></td>
                                        <td>{product.units}</td>
                                        <td>${parseFloat(product.revenue).toLocaleString()}</td>
                                        <td className="text-green-600">{product.margin}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Category Chart */}
                <div className="chart-card flex-1">
                    <h4>Ventas por Categoría</h4>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductAnalysis;
