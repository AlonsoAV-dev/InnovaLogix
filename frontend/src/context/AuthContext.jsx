import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Cargar usuario desde localStorage al iniciar
    useEffect(() => {
        const savedUser = localStorage.getItem('innovalogix_user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setIsAuthenticated(true);
        }
    }, []);

    const login = (role, name = null) => {
        const userData = {
            role, // 'admin', 'support', 'user'
            name: name || getRoleDisplayName(role),
            loginTime: new Date().toISOString()
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('innovalogix_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('innovalogix_user');
    };

    const getRoleDisplayName = (role) => {
        const names = {
            'admin': 'Administrador',
            'support': 'Soporte',
            'user': 'Usuario'
        };
        return names[role] || 'Usuario';
    };

    const isAdmin = () => user?.role === 'admin';
    const isSupport = () => user?.role === 'support' || user?.role === 'admin';
    const isUser = () => user?.role === 'user';

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            login,
            logout,
            isAdmin,
            isSupport,
            isUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};
