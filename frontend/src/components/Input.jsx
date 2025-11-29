import React from 'react';
import './Input.css';

const Input = ({
    label,
    error,
    icon: Icon,
    fullWidth = false,
    className = '',
    ...props
}) => {
    return (
        <div className={`input-wrapper ${fullWidth ? 'input-full' : ''} ${className}`}>
            {label && <label className="input-label">{label}</label>}
            <div className="input-container">
                {Icon && <Icon size={18} className="input-icon" />}
                <input
                    className={`input-field ${Icon ? 'has-icon' : ''} ${error ? 'has-error' : ''}`}
                    {...props}
                />
            </div>
            {error && <span className="input-error">{error}</span>}
        </div>
    );
};

export default Input;
