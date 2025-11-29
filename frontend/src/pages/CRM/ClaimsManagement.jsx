import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Button from '../../components/Button';
import './ClaimsManagement.css';

const ClaimsManagement = () => {
    const { claims, customers, updateClaimStatus } = useStore();
    const [filterStatus, setFilterStatus] = useState('Todos'); // Todos, Abierto, Cerrado

    const filteredClaims = claims.filter(c =>
        filterStatus === 'Todos' || c.status === filterStatus
    );

    const getCustomerName = (id) => {
        const customer = customers.find(c => c.id === id);
        return customer ? customer.name : 'Desconocido';
    };

    const handleResolve = (claim) => {
        const resolution = prompt("Ingrese la resolución del caso:", "Se realizó el cambio del producto");
        if (resolution) {
            updateClaimStatus(claim.id, 'Cerrado', resolution);
        }
    };

    return (
        <div className="claims-management">
            <div className="claims-header">
                <h3>Gestión de Reclamos y Devoluciones</h3>
                <div className="filter-tabs">
                    {['Todos', 'Abierto', 'Cerrado'].map(status => (
                        <button
                            key={status}
                            className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="claims-list">
                {filteredClaims.map(claim => (
                    <div key={claim.id} className={`claim-card ${claim.status.toLowerCase()}`}>
                        <div className="claim-status-icon">
                            {claim.status === 'Abierto' ? <Clock size={24} /> : <CheckCircle size={24} />}
                        </div>
                        <div className="claim-content">
                            <div className="claim-top">
                                <span className="claim-type">{claim.type}</span>
                                <span className="claim-date">{new Date(claim.date).toLocaleDateString()}</span>
                            </div>
                            <h4>{claim.product}</h4>
                            <p className="claim-reason">"{claim.reason}"</p>
                            <div className="claim-customer">
                                Cliente: <strong>{getCustomerName(claim.customerId)}</strong>
                            </div>
                            {claim.resolution && (
                                <div className="claim-resolution">
                                    <strong>Resolución:</strong> {claim.resolution}
                                </div>
                            )}
                        </div>
                        <div className="claim-actions">
                            {claim.status === 'Abierto' && (
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleResolve(claim)}
                                >
                                    Resolver
                                </Button>
                            )}
                            <div className={`status-tag ${claim.status.toLowerCase()}`}>
                                {claim.status}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredClaims.length === 0 && (
                    <div className="empty-state">No hay reclamos registrados</div>
                )}
            </div>
        </div>
    );
};

export default ClaimsManagement;
