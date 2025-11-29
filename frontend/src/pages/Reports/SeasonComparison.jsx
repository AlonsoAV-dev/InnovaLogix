import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './SeasonComparison.css';

const SeasonComparison = () => {
    const [season1, setSeason1] = useState('Verano 2023');
    const [season2, setSeason2] = useState('Verano 2024');

    // Mock data for comparison
    const data = {
        'Verano 2023': { sales: 12500, orders: 150, topProduct: 'Carpa 4 Personas' },
        'Invierno 2023': { sales: 18000, orders: 210, topProduct: 'Casaca Térmica' },
        'Verano 2024': { sales: 15000, orders: 180, topProduct: 'Carpa 4 Personas' },
        'Invierno 2024': { sales: 22000, orders: 250, topProduct: 'Botas Trekking' },
    };

    const s1Data = data[season1] || { sales: 0, orders: 0, topProduct: '-' };
    const s2Data = data[season2] || { sales: 0, orders: 0, topProduct: '-' };

    const salesDiff = s2Data.sales - s1Data.sales;
    const salesGrowth = s1Data.sales > 0 ? (salesDiff / s1Data.sales) * 100 : 0;

    return (
        <div className="season-comparison">
            <div className="comparison-controls">
                <div className="control-group">
                    <label>Temporada Base</label>
                    <select value={season1} onChange={e => setSeason1(e.target.value)}>
                        {Object.keys(data).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="vs-badge">VS</div>
                <div className="control-group">
                    <label>Temporada Comparar</label>
                    <select value={season2} onChange={e => setSeason2(e.target.value)}>
                        {Object.keys(data).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="comparison-cards">
                <div className="comp-card">
                    <h4>Ventas Totales</h4>
                    <div className="comp-values">
                        <div className="val-col">
                            <span>{season1}</span>
                            <strong>S/ {s1Data.sales.toLocaleString()}</strong>
                        </div>
                        <div className="val-col">
                            <span>{season2}</span>
                            <strong>S/ {s2Data.sales.toLocaleString()}</strong>
                        </div>
                    </div>
                    <div className={`growth-badge ${salesGrowth >= 0 ? 'positive' : 'negative'}`}>
                        {salesGrowth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {Math.abs(salesGrowth).toFixed(1)}%
                    </div>
                </div>

                <div className="comp-card">
                    <h4>Pedidos Totales</h4>
                    <div className="comp-values">
                        <div className="val-col">
                            <span>{season1}</span>
                            <strong>{s1Data.orders}</strong>
                        </div>
                        <div className="val-col">
                            <span>{season2}</span>
                            <strong>{s2Data.orders}</strong>
                        </div>
                    </div>
                </div>

                <div className="comp-card">
                    <h4>Producto Top</h4>
                    <div className="comp-values">
                        <div className="val-col">
                            <span>{season1}</span>
                            <strong>{s1Data.topProduct}</strong>
                        </div>
                        <div className="val-col">
                            <span>{season2}</span>
                            <strong>{s2Data.topProduct}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeasonComparison;
