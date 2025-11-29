import React, { useState } from 'react';
import { LayoutDashboard, Users, Award, AlertCircle, MessageSquare } from 'lucide-react';
import CRMDashboard from './CRMDashboard';
import CustomerList from './CustomerList';
import LoyaltyProgram from './LoyaltyProgram';
import ClaimsManagement from './ClaimsManagement';
import SatisfactionSurveys from './SatisfactionSurveys';
import './CRM.css';

const CRM = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="crm-container">
            <div className="crm-header">
                <h2 className="page-title">CRM & Clientes</h2>
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <LayoutDashboard size={18} /> <span className="tab-label">Dashboard</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('customers')}
                    >
                        <Users size={18} /> <span className="tab-label">Clientes</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'loyalty' ? 'active' : ''}`}
                        onClick={() => setActiveTab('loyalty')}
                    >
                        <Award size={18} /> <span className="tab-label">Fidelización</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
                        onClick={() => setActiveTab('claims')}
                    >
                        <AlertCircle size={18} /> <span className="tab-label">Reclamos</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'surveys' ? 'active' : ''}`}
                        onClick={() => setActiveTab('surveys')}
                    >
                        <MessageSquare size={18} /> <span className="tab-label">Encuestas</span>
                    </button>
                </div>
            </div>

            <div className="crm-content">
                {activeTab === 'dashboard' && <CRMDashboard />}
                {activeTab === 'customers' && <CustomerList />}
                {activeTab === 'loyalty' && <LoyaltyProgram />}
                {activeTab === 'claims' && <ClaimsManagement />}
                {activeTab === 'surveys' && <SatisfactionSurveys />}
            </div>
        </div>
    );
};

export default CRM;
