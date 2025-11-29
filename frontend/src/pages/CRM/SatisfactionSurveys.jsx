import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Star, MessageSquare } from 'lucide-react';
import './SatisfactionSurveys.css';

const SatisfactionSurveys = () => {
    const { surveys, customers } = useStore();

    const getCustomerName = (id) => {
        const customer = customers.find(c => c.id === id);
        return customer ? customer.name : 'Anónimo';
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={16}
                fill={i < rating ? "#f59e0b" : "none"}
                color={i < rating ? "#f59e0b" : "#cbd5e1"}
            />
        ));
    };

    const averageRating = surveys.length > 0
        ? (surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length).toFixed(1)
        : '0.0';

    return (
        <div className="surveys-container">
            <div className="surveys-header">
                <div className="rating-summary">
                    <div className="big-rating">{averageRating}</div>
                    <div className="rating-stars">
                        {renderStars(Math.round(parseFloat(averageRating)))}
                    </div>
                    <div className="total-reviews">{surveys.length} valoraciones</div>
                </div>
                <div className="survey-info">
                    <h3>Encuestas de Satisfacción</h3>
                    <p>Opiniones recientes de los clientes</p>
                </div>
            </div>

            <div className="reviews-list">
                {surveys.map(survey => (
                    <div key={survey.id} className="review-card">
                        <div className="review-header">
                            <div className="reviewer-info">
                                <span className="reviewer-name">{getCustomerName(survey.customerId)}</span>
                                <span className="review-date">{new Date(survey.date).toLocaleDateString()}</span>
                            </div>
                            <div className="review-rating">
                                {renderStars(survey.rating)}
                            </div>
                        </div>
                        <div className="review-content">
                            <MessageSquare size={16} className="quote-icon" />
                            <p>"{survey.comment}"</p>
                        </div>
                    </div>
                ))}
                {surveys.length === 0 && (
                    <div className="empty-state">No hay encuestas registradas</div>
                )}
            </div>
        </div>
    );
};

export default SatisfactionSurveys;
