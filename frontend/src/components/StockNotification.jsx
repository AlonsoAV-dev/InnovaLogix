import React, { useEffect } from 'react';
import { Package, X } from 'lucide-react';
import './StockNotification.css';

const StockNotification = ({ show, productName, stock, action, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // Auto-hide after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    const getActionText = () => {
        switch (action) {
            case 'increment':
                return 'Stock incrementado';
            case 'decrement':
                return 'Stock reducido';
            case 'update':
                return 'Stock actualizado';
            default:
                return 'Stock actualizado';
        }
    };

    return (
        <div className="stock-notification">
            <div className="stock-notification-icon">
                <Package size={24} />
            </div>
            <div className="stock-notification-content">
                <h3 className="stock-notification-title">{getActionText()}</h3>
                <p className="stock-notification-message">
                    <strong>{productName}</strong>
                </p>
                <p className="stock-notification-detail">
                    Nuevo stock: <strong>{stock}</strong> unidades
                </p>
            </div>
            <button className="stock-notification-close" onClick={onClose}>
                <X size={18} />
            </button>
        </div>
    );
};

export default StockNotification;
