import React from 'react';
import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    icon: Icon,
    className = '',
    ...props
}) => {
    return (
        <button
            className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
            {...props}
        >
            {Icon && <Icon size={18} className="btn-icon" />}
            {children}
        </button>
    );
};

export default Button;
