import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, ShieldAlert, CheckCircle, XCircle, Clock, User, FileText, Hash } from 'lucide-react';
import './AuditLogs.css';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [integrity, setIntegrity] = useState({ valid: true, brokenAtId: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        try {
            const response = await axios.get('http://localhost:3005/api/audit-logs');
            setLogs(response.data.logs);
            setIntegrity(response.data.integrity);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching audit logs:", err);
            setError("No se pudieron cargar los registros de auditoría.");
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Cargando auditoría...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="audit-view fade-in">
            <div className="audit-header">
                <h3>Control de Auditoría (ESC-20)</h3>
                <div className={`integrity-badge ${integrity.valid ? 'valid' : 'invalid'}`}>
                    {integrity.valid ? (
                        <>
                            <Shield size={20} />
                            <span>Integridad Verificada</span>
                        </>
                    ) : (
                        <>
                            <ShieldAlert size={20} />
                            <span>Integridad Comprometida (ID: {integrity.brokenAtId})</span>
                        </>
                    )}
                </div>
            </div>

            <div className="audit-stats">
                <div className="stat-card">
                    <div className="stat-icon bg-blue-100 text-blue-600">
                        <FileText size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Registros</span>
                        <h4 className="stat-value">{logs.length}</h4>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-green-100 text-green-600">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Estado del Sistema</span>
                        <h4 className="stat-value">{integrity.valid ? 'Seguro' : 'Riesgo'}</h4>
                    </div>
                </div>
            </div>

            <div className="table-container mt-4">
                <table className="audit-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Acción</th>
                            <th>Recurso</th>
                            <th>Fecha</th>
                            <th>Hash de Integridad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td>#{log.id}</td>
                                <td>
                                    <div className="user-cell">
                                        <User size={14} />
                                        {log.user_id}
                                    </div>
                                </td>
                                <td><span className="action-badge">{log.action}</span></td>
                                <td>{log.resource}</td>
                                <td>
                                    <div className="time-cell">
                                        <Clock size={14} />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </td>
                                <td className="hash-cell" title={log.hash}>
                                    <Hash size={14} />
                                    {log.hash.substring(0, 15)}...
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-gray-500">
                                    No hay registros de auditoría.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogs;
