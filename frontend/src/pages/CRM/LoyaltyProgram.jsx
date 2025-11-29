import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Gift, PlusCircle, MinusCircle } from 'lucide-react';
import Button from '../../components/Button';
import './LoyaltyProgram.css';

const LoyaltyProgram = () => {
    const { customers, updateCustomerPoints } = useStore();

    // Sort by points descending
    const sortedCustomers = [...customers].sort((a, b) => b.points - a.points);

    const handleRedeem = (customer) => {
        if (customer.points < 50) {
            alert("Puntos insuficientes. Mínimo 50 puntos para canjear.");
            return;
        }
        if (window.confirm(`¿Canjear 50 puntos para ${customer.name}?`)) {
            updateCustomerPoints(customer.id, -50);
            alert("Canje realizado exitosamente.");
        }
    };

    const handleAddPoints = (customer) => {
        const points = prompt("Ingrese cantidad de puntos a agregar:", "10");
        if (points && !isNaN(points)) {
            updateCustomerPoints(customer.id, parseInt(points));
        }
    };

    return (
        <div className="loyalty-program">
            <div className="loyalty-header">
                <div className="program-info">
                    <h3>Programa de Puntos</h3>
                    <p>1 Punto por cada S/ 10 de compra. Canje mínimo: 50 puntos.</p>
                </div>
                <div className="rewards-preview">
                    <div className="reward-card">
                        <Gift size={20} />
                        <span>50 pts = 5% Dscto</span>
                    </div>
                    <div className="reward-card">
                        <Gift size={20} />
                        <span>100 pts = 10% Dscto</span>
                    </div>
                </div>
            </div>

            <div className="loyalty-list">
                {sortedCustomers.map(customer => (
                    <div key={customer.id} className="loyalty-card">
                        <div className="loyalty-user-info">
                            <div className="avatar-circle">{customer.name.charAt(0)}</div>
                            <div>
                                <h4>{customer.name}</h4>
                                <span className="points-display">{customer.points} Puntos</span>
                            </div>
                        </div>
                        <div className="loyalty-actions">
                            <Button
                                size="sm"
                                variant="outline"
                                icon={PlusCircle}
                                onClick={() => handleAddPoints(customer)}
                            >
                                Sumar
                            </Button>
                            <Button
                                size="sm"
                                icon={Gift}
                                onClick={() => handleRedeem(customer)}
                                disabled={customer.points < 50}
                            >
                                Canjear
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LoyaltyProgram;
