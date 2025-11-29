import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Search, MessageCircle, UserPlus } from 'lucide-react';
import Input from '../../components/Input';
import Button from '../../components/Button';
import './CustomerList.css';

const CustomerList = () => {
    const { customers, addCustomer } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Todos'); // Todos, Frecuente, Nuevo, Mayorista

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'Todos' || c.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleChat = (name) => {
        alert(`Iniciando chat con ${name}...`);
    };

    return (
        <div className="customer-list-container">
            <div className="list-controls">
                <div className="search-bar">
                    <Input
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        icon={Search}
                    />
                </div>
                <div className="filter-tabs">
                    {['Todos', 'Frecuente', 'Nuevo', 'Mayorista'].map(type => (
                        <button
                            key={type}
                            className={`filter-btn ${filterType === type ? 'active' : ''}`}
                            onClick={() => setFilterType(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <Button icon={UserPlus}>Nuevo Cliente</Button>
            </div>

            <table className="customers-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Contacto</th>
                        <th>Tipo</th>
                        <th>Puntos</th>
                        <th>Compras</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCustomers.map(customer => (
                        <tr key={customer.id}>
                            <td>
                                <div className="customer-name">{customer.name}</div>
                                <div className="customer-email">{customer.email}</div>
                            </td>
                            <td>{customer.phone}</td>
                            <td>
                                <span className={`type-badge ${customer.type.toLowerCase()}`}>
                                    {customer.type}
                                </span>
                            </td>
                            <td>{customer.points} pts</td>
                            <td>{customer.totalPurchases}</td>
                            <td>
                                <button
                                    className="icon-btn chat"
                                    onClick={() => handleChat(customer.name)}
                                    title="Chat"
                                >
                                    <MessageCircle size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center text-muted">No se encontraron clientes</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CustomerList;
