/**
 * Mock Payment API Service
 * Simulates generating QR codes and checking payment status.
 */

export const generatePaymentQR = async (amount, method) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                transactionId: `TXN-${Date.now()}`,
                qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAY-${method}-${amount}-${Date.now()}`,
                expiresIn: 300 // seconds
            });
        }, 1500); // Simulate network delay
    });
};

export const checkPaymentStatus = async (transactionId) => {
    return new Promise((resolve) => {
        // Simulate a 30% chance of "pending" and 70% chance of "completed" after initial delay
        // For demo purposes, we'll just wait a bit and return success
        setTimeout(() => {
            resolve({
                status: 'COMPLETED', // PENDING, COMPLETED, FAILED
                message: 'Pago recibido exitosamente'
            });
        }, 3000); // Simulate user taking time to pay
    });
};

export const simulatePOSPayment = async (amount) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                transactionId: `POS-${Date.now()}`,
                message: 'Pago aprobado en terminal'
            });
        }, 4000); // Simulate time to insert card and enter PIN
    });
};
