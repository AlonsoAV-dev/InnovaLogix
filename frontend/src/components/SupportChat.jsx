import { useState, useEffect, useRef } from 'react';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import './SupportChat.css';

function SupportChat({ isOpen, onClose }) {
    const { user, isSupport } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatState, setChatState] = useState('initial'); // initial, waiting, active, closed
    const [agentName, setAgentName] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [currentClientSocketId, setCurrentClientSocketId] = useState(null);
    const messagesEndRef = useRef(null);

    // Escuchar solicitudes SIEMPRE si es agente (no depende de isOpen)
    useEffect(() => {
        if (!isSupport()) return;

        const crmSocket = socketService.sockets.crm;
        if (!crmSocket) return;

        const handleNewRequest = (data) => {
            console.log('📢 Nueva solicitud de soporte en SupportChat:', data);
            setPendingRequests(prev => {
                // Evitar duplicados
                const exists = prev.some(req => req.clientSocketId === data.clientSocketId);
                if (exists) return prev;
                return [...prev, data];
            });
        };

        crmSocket.on('nueva_solicitud', handleNewRequest);

        return () => {
            crmSocket.off('nueva_solicitud', handleNewRequest);
        };
    }, [isSupport]);

    // Escuchar eventos del chat cuando está abierto
    useEffect(() => {
        if (!isOpen) return;

        const crmSocket = socketService.sockets.crm;
        if (!crmSocket) return;

        // Escuchar cuando un agente acepta
        crmSocket.on('agente_entra', (data) => {
            setAgentName(data.agentName);
            setChatState('active');
            setMessages(prev => [...prev, {
                type: 'system',
                message: data.message,
                timestamp: new Date()
            }]);
        });

        // Sala creada (para agente)
        crmSocket.on('sala_creada', (data) => {
            setChatState('active');
            setMessages([{
                type: 'system',
                message: `Conectado con ${data.clientName}`,
                timestamp: new Date()
            }]);
        });

        // Mensaje del cliente
        crmSocket.on('nuevo_mensaje_cliente', (data) => {
            setMessages(prev => [...prev, {
                type: 'customer',
                sender: data.sender,
                message: data.message,
                timestamp: data.timestamp
            }]);
        });

        // Mensaje del agente
        crmSocket.on('nuevo_mensaje_agente', (data) => {
            setMessages(prev => [...prev, {
                type: 'agent',
                sender: data.sender,
                message: data.message,
                timestamp: data.timestamp
            }]);
        });

        // Servicio finalizado
        crmSocket.on('servicio_finalizado', (data) => {
            setChatState('closed');
            setMessages(prev => [...prev, {
                type: 'system',
                message: data.message,
                timestamp: new Date()
            }]);
        });

        // Esperando agente
        crmSocket.on('esperando_agente', (data) => {
            setMessages(prev => [...prev, {
                type: 'system',
                message: data.message,
                timestamp: new Date()
            }]);
        });

        return () => {
            crmSocket.off('agente_entra');
            crmSocket.off('sala_creada');
            crmSocket.off('nuevo_mensaje_cliente');
            crmSocket.off('nuevo_mensaje_agente');
            crmSocket.off('servicio_finalizado');
            crmSocket.off('esperando_agente');
        };
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const requestSupport = () => {
        setChatState('waiting');

        const crmSocket = socketService.sockets.crm;
        if (!crmSocket) {
            alert('Error: No hay conexión con el servicio de soporte');
            return;
        }

        // Emitir solicitud de soporte (el mensaje vendrá del servidor)
        crmSocket.emit('solicitar_soporte', {
            clientName: user?.name || 'Usuario'
        });
    };

    const acceptRequest = (clientSocketId, clientName) => {
        const crmSocket = socketService.sockets.crm;
        if (!crmSocket) return;

        setCurrentClientSocketId(clientSocketId);
        
        // Emitir aceptación
        crmSocket.emit('agente_acepta', {
            clientSocketId,
            agentName: user?.name || 'Agente'
        });

        // Limpiar solicitudes
        setPendingRequests(prev => prev.filter(req => req.clientSocketId !== clientSocketId));
    };

    const sendMessage = () => {
        if (!newMessage.trim() || chatState !== 'active') return;

        const crmSocket = socketService.sockets.crm;
        if (!crmSocket) return;

        // Si es agente, usar agente_envia
        if (isSupport()) {
            crmSocket.emit('agente_envia', {
                clientSocketId: currentClientSocketId,
                message: newMessage
            });
        } else {
            // Si es cliente, usar cliente_envia
            crmSocket.emit('cliente_envia', {
                message: newMessage
            });
        }

        setNewMessage('');
    };

    const closeChat = () => {
        const crmSocket = socketService.sockets.crm;
        
        if (chatState === 'active' && crmSocket) {
            crmSocket.emit('cerrar_chat');
        }
        
        // Reset state
        setMessages([]);
        setChatState('initial');
        setAgentName(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="support-chat-overlay">
            <div className="support-chat-modal">
                <div className="chat-header">
                    <div className="chat-header-info">
                        <span className="chat-icon">💬</span>
                        <h3>Chat de Soporte</h3>
                        {chatState === 'active' && agentName && (
                            <span className="agent-info">con {agentName}</span>
                        )}
                    </div>
                    <button className="close-btn" onClick={closeChat}>✖</button>
                </div>

                <div className="chat-body">
                    {/* Vista para AGENTE: Mostrar solicitudes pendientes */}
                    {isSupport() && chatState === 'initial' && (
                        <div className="chat-initial">
                            <div className="welcome-message">
                                <h4>👨‍💼 Panel de Soporte</h4>
                                <p>Solicitudes pendientes de atención</p>
                            </div>
                            {pendingRequests.length === 0 ? (
                                <p className="no-requests">No hay solicitudes pendientes</p>
                            ) : (
                                <div className="pending-requests">
                                    {pendingRequests.map((req, i) => (
                                        <div key={i} className="request-item">
                                            <div className="request-info">
                                                <strong>{req.clientName}</strong>
                                                <span className="request-time">
                                                    {new Date(req.timestamp).toLocaleTimeString('es-PE')}
                                                </span>
                                            </div>
                                            <button 
                                                className="accept-request-btn"
                                                onClick={() => acceptRequest(req.clientSocketId, req.clientName)}
                                            >
                                                Atender Cliente
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vista para CLIENTE: Solicitar soporte */}
                    {!isSupport() && chatState === 'initial' && (
                        <div className="chat-initial">
                            <div className="welcome-message">
                                <h4>👋 ¡Hola! ¿En qué podemos ayudarte?</h4>
                                <p>Nuestro equipo de soporte está listo para asistirte</p>
                            </div>
                            <button className="request-support-btn" onClick={requestSupport}>
                                Solicitar Soporte
                            </button>
                        </div>
                    )}

                    {(chatState === 'waiting' || chatState === 'active' || chatState === 'closed') && (
                        <>
                            <div className="chat-messages">
                                {messages.map((msg, i) => (
                                    <div 
                                        key={i} 
                                        className={`message ${msg.type === 'system' ? 'system' : msg.type}`}
                                    >
                                        {msg.type === 'system' ? (
                                            <div className="system-message">
                                                <span className="system-icon">ℹ️</span>
                                                <span>{msg.message}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="message-header">
                                                    <strong>{msg.sender}</strong>
                                                    <span className="timestamp">
                                                        {new Date(msg.timestamp).toLocaleTimeString('es-PE', { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="message-content">{msg.message}</div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {chatState === 'active' && (
                                <div className="chat-input">
                                    <input 
                                        type="text"
                                        value={newMessage} 
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Escribe tu mensaje..."
                                        autoFocus
                                    />
                                    <button 
                                        className="send-btn" 
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim()}
                                    >
                                        Enviar
                                    </button>
                                </div>
                            )}

                            {chatState === 'closed' && (
                                <div className="chat-closed-message">
                                    <p>Este chat ha finalizado</p>
                                    <button onClick={closeChat}>Cerrar ventana</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SupportChat;
