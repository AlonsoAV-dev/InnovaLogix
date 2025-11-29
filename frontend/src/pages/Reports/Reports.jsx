import React, { useState } from 'react';
import { BarChart3, Calendar, TrendingUp, Filter } from 'lucide-react';
import SalesOverview from './SalesOverview';
import SeasonComparison from './SeasonComparison';
import TrendsChart from './TrendsChart';
import './Reports.css';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h2 className="page-title">Reportes y Análisis</h2>
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <BarChart3 size={18} /> <span className="tab-label">Ventas Generales</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
                        onClick={() => setActiveTab('comparison')}
                    >
                        <Calendar size={18} /> <span className="tab-label">Comparativo</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
                        onClick={() => setActiveTab('trends')}
                    >
                        <TrendingUp size={18} /> <span className="tab-label">Tendencias</span>
                    </button>
                </div>
            </div>

            <div className="reports-content">
                {activeTab === 'overview' && <SalesOverview />}
                {activeTab === 'comparison' && <SeasonComparison />}
                {activeTab === 'trends' && <TrendsChart />}
            </div>
        </div>
    );
};

export default Reports;
