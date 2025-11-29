import React from 'react';
import './TrendsChart.css';

const TrendsChart = () => {
    // Mock data for chart
    const data = [
        { label: 'Lun', value: 450 },
        { label: 'Mar', value: 850 },
        { label: 'Mie', value: 620 },
        { label: 'Jue', value: 900 },
        { label: 'Vie', value: 1200 },
        { label: 'Sab', value: 1500 },
        { label: 'Dom', value: 1100 },
    ];

    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="trends-chart">
            <div className="chart-header">
                <h3>Tendencia de Ventas (Última Semana)</h3>
            </div>

            <div className="bar-chart-container">
                <div className="y-axis">
                    <span>S/ {maxValue}</span>
                    <span>S/ {maxValue / 2}</span>
                    <span>0</span>
                </div>
                <div className="bars-area">
                    {data.map((item, index) => (
                        <div key={index} className="bar-group">
                            <div
                                className="bar"
                                style={{ height: `${(item.value / maxValue) * 100}%` }}
                                title={`S/ ${item.value}`}
                            ></div>
                            <span className="bar-label">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrendsChart;
