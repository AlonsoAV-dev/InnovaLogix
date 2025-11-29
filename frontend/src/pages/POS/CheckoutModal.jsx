import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle, QrCode, Loader, Smartphone, CreditCard, Terminal } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useStore } from '../../context/StoreContext';
import { generatePaymentQR, checkPaymentStatus, simulatePOSPayment } from '../../services/paymentApi';
import { generateReceiptPDF } from '../../services/receiptService';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose }) => {
    const { cart, clearCart, addSale } = useStore();
    const [step, setStep] = useState('payment'); // payment, qr, pos, success
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [receiptType, setReceiptType] = useState('ticket'); // ticket (simple), boleta, factura
    const [clientData, setClientData] = useState({ docNumber: '', name: '', address: '' });
    const [qrData, setQrData] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [lastSale, setLastSale] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed
            setStep('payment');
            setPaymentMethod('cash');
            setReceiptType('ticket');
            setClientData({ docNumber: '', name: '', address: '' });
            setQrData(null);
            setStatusMessage('');
            setLastSale(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.18;

    const handlePayment = async () => {
        if (paymentMethod === 'cash') {
            processSale();
        } else if (paymentMethod === 'tarjeta') {
            // Simulate POS Terminal
            setStep('pos');
            setStatusMessage('Enviando monto al POS...');
            try {
                // Simulate waiting for POS
                setTimeout(() => setStatusMessage('Esperando tarjeta en terminal...'), 1000);
                setTimeout(() => setStatusMessage('Procesando pago...'), 3000);

                const result = await simulatePOSPayment(total);
                if (result.success) {
                    processSale();
                }
            } catch (error) {
                setStatusMessage('Error en terminal POS. Intente nuevamente.');
                setTimeout(() => setStep('payment'), 2000);
            }
        } else {
            // Generate QR for Yape/Plin
            setStep('qr');
            setStatusMessage('Generando código QR...');
            try {
                const data = await generatePaymentQR(total, paymentMethod);
                setQrData(data);
                setStatusMessage('Esperando pago...');

                // Simulate polling for status
                setTimeout(async () => {
                    setStatusMessage('Verificando transacción...');
                    const status = await checkPaymentStatus(data.transactionId);
                    if (status.status === 'COMPLETED') {
                        processSale();
                    }
                }, 5000); // Wait 5s before "detecting" payment
            } catch (error) {
                setStatusMessage('Error al generar QR. Intente nuevamente.');
                setStep('payment');
            }
        }
    };

    const processSale = () => {
        const saleData = addSale({
            total,
            items: cart.reduce((sum, item) => sum + item.quantity, 0),
            paymentMethod,
            receiptType,
            clientData: receiptType === 'ticket' ? null : clientData
        });

        setLastSale(saleData);
        generateReceiptPDF(saleData, cart); // Auto-download PDF

        setStep('success');
        clearCart();
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {step === 'success' ? 'Venta Exitosa' : 'Procesar Pago'}
                    </h2>
                    <button className="close-btn" onClick={handleClose}>
                        <X size={24} />
                    </button>
                </div>

                {step === 'payment' && (
                    <div className="modal-body">
                        <div className="payment-summary">
                            <span className="total-label">Total a Pagar</span>
                            <span className="total-amount">S/ {total.toFixed(2)}</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tipo de Comprobante</label>
                            <div className="option-grid">
                                <button
                                    className={`option-btn ${receiptType === 'ticket' ? 'active' : ''}`}
                                    onClick={() => setReceiptType('ticket')}
                                >
                                    Boleta Simple
                                </button>
                                <button
                                    className={`option-btn ${receiptType === 'boleta' ? 'active' : ''}`}
                                    onClick={() => setReceiptType('boleta')}
                                >
                                    Bol. Electrónica
                                </button>
                                <button
                                    className={`option-btn ${receiptType === 'factura' ? 'active' : ''}`}
                                    onClick={() => setReceiptType('factura')}
                                >
                                    Factura
                                </button>
                            </div>
                        </div>

                        {/* Conditional Inputs based on Receipt Type */}
                        {receiptType === 'boleta' && (
                            <div className="client-data-form">
                                <Input
                                    label="DNI Cliente"
                                    placeholder="Ingrese DNI"
                                    value={clientData.docNumber}
                                    onChange={e => setClientData({ ...clientData, docNumber: e.target.value })}
                                />
                                <Input
                                    label="Nombre (Opcional)"
                                    placeholder="Nombre del cliente"
                                    value={clientData.name}
                                    onChange={e => setClientData({ ...clientData, name: e.target.value })}
                                />
                            </div>
                        )}

                        {receiptType === 'factura' && (
                            <div className="client-data-form">
                                <Input
                                    label="RUC Empresa"
                                    placeholder="Ingrese RUC"
                                    value={clientData.docNumber}
                                    onChange={e => setClientData({ ...clientData, docNumber: e.target.value })}
                                />
                                <Input
                                    label="Razón Social"
                                    placeholder="Nombre de la empresa"
                                    value={clientData.name}
                                    onChange={e => setClientData({ ...clientData, name: e.target.value })}
                                />
                                <Input
                                    label="Dirección"
                                    placeholder="Dirección fiscal"
                                    value={clientData.address}
                                    onChange={e => setClientData({ ...clientData, address: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Método de Pago</label>
                            <div className="option-grid">
                                <button
                                    className={`option-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('cash')}
                                >
                                    Efectivo
                                </button>
                                <button
                                    className={`option-btn ${paymentMethod === 'tarjeta' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('tarjeta')}
                                >
                                    <CreditCard size={18} /> Tarjeta
                                </button>
                                <button
                                    className={`option-btn ${paymentMethod === 'yape' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('yape')}
                                >
                                    <Smartphone size={18} /> Yape/Plin
                                </button>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <Button variant="outline" onClick={handleClose} fullWidth>Cancelar</Button>
                            <Button variant="primary" onClick={handlePayment} fullWidth>
                                {paymentMethod === 'cash' ? 'Confirmar Pago' :
                                    paymentMethod === 'tarjeta' ? 'Procesar en POS' : 'Generar QR'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* POS Terminal State */}
                {step === 'pos' && (
                    <div className="modal-body pos-state">
                        <div className="pos-animation">
                            <Terminal size={64} className="pos-icon" />
                            <CreditCard size={32} className="card-icon-anim" />
                        </div>
                        <h3>Terminal POS</h3>
                        <p>{statusMessage}</p>
                        <div className="loader-bar"></div>
                    </div>
                )}

                {/* QR State */}
                {step === 'qr' && (
                    <div className="modal-body qr-state">
                        {qrData ? (
                            <>
                                <div className="qr-container">
                                    <img src={qrData.qrUrl} alt="Payment QR" className="qr-image" />
                                </div>
                                <div className="qr-instructions">
                                    <p>Escanea el código con tu billetera digital</p>
                                    <p className="amount-display">Monto: S/ {total.toFixed(2)}</p>
                                </div>
                            </>
                        ) : (
                            <div className="loading-container">
                                <Loader className="spinner" size={48} />
                            </div>
                        )}

                        <div className="status-message">
                            <Loader className="spinner-sm" size={16} />
                            <span>{statusMessage}</span>
                        </div>

                        <Button variant="outline" onClick={() => setStep('payment')} fullWidth>
                            Cancelar
                        </Button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="modal-body success-state">
                        <CheckCircle size={64} className="success-icon" />
                        <h3>¡Pago Realizado!</h3>
                        <p>
                            {receiptType === 'factura' ? 'Factura generada correctamente.' :
                                receiptType === 'boleta' ? 'Boleta electrónica generada.' :
                                    'Venta registrada correctamente.'}
                        </p>
                        {lastSale && <p className="receipt-number">Nro: {lastSale.receiptNumber}</p>}

                        <div className="receipt-actions">
                            <Button icon={Printer} variant="secondary">
                                Imprimir {receiptType === 'ticket' ? 'Ticket' : receiptType === 'boleta' ? 'Boleta' : 'Factura'}
                            </Button>
                            <Button variant="outline" onClick={handleClose}>Nueva Venta</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckoutModal;
