import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const { login } = useAuth();
    const [hoveredRole, setHoveredRole] = useState(null);

    const roles = [
        {
            id: 'admin',
            name: 'Administrador',
            icon: '👨‍💼',
            description: 'Acceso completo al sistema',
            color: 'var(--color-primary)'
        },
        {
            id: 'support',
            name: 'Soporte',
            icon: '💬',
            description: 'Atención a clientes y chat',
            color: 'var(--color-secondary)'
        },
        {
            id: 'user',
            name: 'Usuario',
            icon: '👤',
            description: 'Acceso a funciones básicas',
            color: 'var(--color-success)'
        }
    ];

    const handleRoleSelect = (roleId) => {
        login(roleId);
    };

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="login-overlay"></div>
            </div>
            
            <div className="login-content">
                <div className="login-header">
                    <div className="login-logo">
                        <span className="logo-icon">🏕️</span>
                        <h1>InnovaLogix</h1>
                    </div>
                    <p className="login-subtitle">Sistema de Gestión Empresarial</p>
                </div>

                <div className="role-selection">
                    <h2>Selecciona tu rol</h2>
                    <p className="role-instruction">Elige cómo deseas ingresar al sistema</p>

                    <div className="role-cards">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                className={`role-card ${hoveredRole === role.id ? 'hovered' : ''}`}
                                onClick={() => handleRoleSelect(role.id)}
                                onMouseEnter={() => setHoveredRole(role.id)}
                                onMouseLeave={() => setHoveredRole(null)}
                            >
                                <div className="role-icon" style={{ color: role.color }}>
                                    {role.icon}
                                </div>
                                <h3>{role.name}</h3>
                                <p>{role.description}</p>
                                <div className="role-arrow">→</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="login-footer">
                    <p>© 2025 InnovaLogix - Sistema de Gestión Outdoor</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
