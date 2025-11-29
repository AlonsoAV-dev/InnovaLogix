import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Users, Award, AlertCircle, Star, TrendingUp } from 'lucide-react';
import './CRMDashboard.css';

const CRMDashboard = () => {
    const { customers, claims, surveys } = useStore();

    const totalPoints = customers.reduce((sum, c) => sum + c.points, 0);
    const openClaims = claims.filter(c => c.status === 'Abierto').length;
    const avgRating = surveys.length > 0
        ? (surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length).toFixed(1)
        : '0.0';

    const frequentClients = customers.filter(c => c.type === 'Frecuente').length;
    const newClients = customers.filter(c => c.type === 'Nuevo').length;
    const wholesaleClients = customers.filter(c => c.type === 'Mayorista').length;

    return (
        <div className="crm-dashboard">
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon users">
                        <Users size={24} />
                    </div>
                    <div className="metric-info">
                        <h3>{customers.length}</h3>
                        <p>Total Clientes</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon points">
                        <Award size={24} />
                    </div>
                    <div className="metric-info">
                        <h3>{totalPoints}</h3>
                        <p>Puntos Activos</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon claims">
                        <AlertCircle size={24} />
                    </div>
                    <div className="metric-info">
                        <h3>{openClaims}</h3>
                        <p>Reclamos Abiertos</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon rating">
                        <Star size={24} />
                    </div>
                    <div className="metric-info">
                        <h3>{avgRating} / 5</h3>
                        <p>Satisfacción</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-sections">
                <div className="section-card segmentation">
                    <h4>Segmentación de Clientes</h4>
                    <div className="segmentation-stats">
                        <div className="stat-item">
                            <span className="stat-label">Frecuentes</span>
                            <div className="progress-bar">
                                <div className="fill frequent" style={{ width: `${(frequentClients / customers.length) * 100}%` }}></div>
                            </div>
                            <span className="stat-value">{frequentClients}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Nuevos</span>
                            <div className="progress-bar">
                                <div className="fill new" style={{ width: `${(newClients / customers.length) * 100}%` }}></div>
                            </div>
                            <span className="stat-value">{newClients}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Mayoristas</span>
                            <div className="progress-bar">
                                <div className="fill wholesale" style={{ width: `${(wholesaleClients / customers.length) * 100}%` }}></div>
                            </div>
                            <span className="stat-value">{wholesaleClients}</span>
                        </div>
                    </div>
                </div>

                <div className="section-card activity">
                    <h4>Actividad del Mes</h4>
                    <div className="activity-list">
                        <div className="activity-item">
                            <TrendingUp size={16} className="text-success" />
                            <span>5 Nuevos clientes registrados</span>
                            <span className="activity-date">Hoy</span>
                        </div>
                        <div className="activity-item">
                            <Award size={16} className="text-warning" />
                            <span>2 Clientes canjearon puntos</span>
                            <span className="activity-date">Ayer</span>
                        </div>
                        <div className="activity-item">
                            <AlertCircle size={16} className="text-error" />
                            <span>1 Reclamo nuevo registrado</span>
                            <span className="activity-date">23 Nov</span>
                        </div>
                        <div className="activity-item">
                            <Star size={16} className="text-primary" />
                            <span>3 Nuevas encuestas recibidas</span>
                            <span className="activity-date">22 Nov</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CRMDashboard;
