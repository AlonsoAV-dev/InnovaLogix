import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Clock } from 'lucide-react';
import axios from 'axios';
import './Reports.css';

import { ExportService } from '../../services/ExportService';

const InventoryReports = () => {
    const [inventoryData, setInventoryData] = useState(null);
    const [criticalProducts, setCriticalProducts] = useState([]);
    const [slowRotation, setSlowRotation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportStatus, setExportStatus] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invRes, critRes, slowRes] = await Promise.all([
                    axios.get('http://localhost:3005/api/reports/inventory'),
                    axios.get('http://localhost:3005/api/reports/inventory/critical'),
                    axios.get('http://localhost:3005/api/reports/inventory/slow-rotation')
                ]);
                setInventoryData(invRes.data || { byCategory: [] });
                setCriticalProducts(Array.isArray(critRes.data) ? critRes.data : []);
                setSlowRotation(Array.isArray(slowRes.data) ? slowRes.data : []);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching inventory reports:", error);
                setInventoryData({ byCategory: [] });
                setCriticalProducts([]);
                setSlowRotation([]);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleExport = async () => {
        try {
            await ExportService.downloadReport(
                'http://localhost:3005/api/reports/export/inventory',
                'Reporte_Inventario.pdf',
                setExportStatus
            );
            setTimeout(() => setExportStatus(''), 3000); // Clear status after 3s
        } catch (error) {
            alert(error.message);
            setExportStatus('');
        }
    };

    if (loading) return <div className="loading">Cargando inventario...</div>;

    const totalStock = (inventoryData?.byCategory && Array.isArray(inventoryData.byCategory))
        ? inventoryData.byCategory.reduce((sum, cat) => sum + (cat.totalStock || 0), 0)
        : 0;

    return (
        <div className="report-view fade-in">
            <div className="report-header-actions">
                <h3>Gestión de Inventario</h3>
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
                        <span className="kpi-label">Total en Stock</span>
                        <h4 className="kpi-value">{totalStock.toLocaleString()}</h4>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon bg-red-100 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Productos Críticos</span>
                        <h4 className="kpi-value">{criticalProducts.length}</h4>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon bg-yellow-100 text-yellow-600">
                        <Clock size={24} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Rotación Lenta</span>
                        <h4 className="kpi-value">{slowRotation.length}</h4>
                    </div>
                </div>
            </div>

            {/* Critical Products Table */}
            <div className="chart-card full-width">
                <h4>Productos por Reponer</h4>
                <div className="table-container">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Stock Actual</th>
                                <th>Stock Mínimo</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {criticalProducts.map((product) => (
                                <tr key={product.id}>
                                    <td className="font-medium">{product.name}</td>
                                    <td>{product.category}</td>
                                    <td>{product.stock}</td>
                                    <td>{product.minstock}</td>
                                    <td>
                                        <span className={`badge ${product.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {criticalProducts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-gray-500">
                                        No hay productos críticos por reponer.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slow Rotation List */}
            <div className="chart-card full-width mt-4">
                <h4>Productos de Rotación Lenta</h4>
                <div className="table-container">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Última Venta</th>
                                <th>Días Inactivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slowRotation.slice(0, 5).map((product) => (
                                <tr key={product.id}>
                                    <td className="font-medium">{product.name}</td>
                                    <td>{product.category}</td>
                                    <td>{product.lastSale || 'Nunca'}</td>
                                    <td>{product.daysInactive} días</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryReports;
