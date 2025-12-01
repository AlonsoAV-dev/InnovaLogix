import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import './SupportNotification.css';

function SupportNotification({ show, clientName, onClose, onOpen }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            // Auto-hide después de 10 segundos
            const timer = setTimeout(() => {
                handleClose();
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [show]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleOpen = () => {
        handleClose();
        onOpen();
    };

    if (!show) return null;

    return (
        <div className={`support-notification ${isVisible ? 'show' : ''}`}>
            <div className="notification-icon">
                <MessageCircle size={24} />
            </div>
            <div className="notification-content">
                <div className="notification-title">Nueva solicitud de soporte</div>
                <div className="notification-message">
                    {clientName} necesita ayuda
                </div>
                <button className="notification-action" onClick={handleOpen}>
                    Atender ahora
                </button>
            </div>
            <button className="notification-close" onClick={handleClose}>
                <X size={18} />
            </button>
        </div>
    );
}

export default SupportNotification;
