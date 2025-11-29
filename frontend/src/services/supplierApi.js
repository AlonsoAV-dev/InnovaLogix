// Mock API to simulate fetching supplier prices and submitting orders
// In a real app, this would make HTTP requests to supplier endpoints

const MOCK_CATALOGS = {
    1: [ // Outdoor Peru S.A.C.
        { productId: 1, name: 'Carpa 4 Personas', category: 'Camping', cost: 175.50, stock: 50 },
        { productId: 2, name: 'Mochila Trekking 60L', category: 'Mochilas', cost: 115.00, stock: 20 },
        { productId: 3, name: 'Linterna Frontal LED', category: 'Accesorios', cost: 22.50, stock: 100 },
        { productId: 4, name: 'Sleeping Bag -5°C', category: 'Camping', cost: 85.00, stock: 30 },
        { productId: 5, name: 'Bastones de Trekking', category: 'Accesorios', cost: 45.00, stock: 40 },
    ],
    2: [ // Importaciones Andinas
        { productId: 1, name: 'Carpa 4 Personas', category: 'Camping', cost: 168.00, stock: 10 },
        { productId: 3, name: 'Linterna Frontal LED', category: 'Accesorios', cost: 20.00, stock: 150 },
        { productId: 6, name: 'Colchoneta Inflable', category: 'Camping', cost: 35.00, stock: 60 },
    ]
};

export const fetchSupplierCatalog = async (supplierId) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const catalog = MOCK_CATALOGS[supplierId] || [];

    // Add some random price fluctuation to simulate real-time changes
    return catalog.map(item => ({
        ...item,
        cost: parseFloat((item.cost + (Math.random() * 2 - 1)).toFixed(2))
    }));
};

export const submitOrder = async (orderData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Validate Stock
    const supplierCatalog = MOCK_CATALOGS[orderData.supplierId];
    if (!supplierCatalog) {
        throw new Error("Proveedor no encontrado");
    }

    for (const item of orderData.items) {
        const product = supplierCatalog.find(p => p.productId === item.productId);
        if (!product) {
            throw new Error(`Producto ID ${item.productId} no encontrado en el catálogo del proveedor`);
        }
        if (item.quantity > product.stock) {
            throw new Error(`Stock insuficiente para ${product.name}. Solicitado: ${item.quantity}, Disponible: ${product.stock}`);
        }
    }

    // Simulate success/failure
    if (Math.random() > 0.9) {
        throw new Error("Error de conexión con el proveedor");
    }

    return {
        success: true,
        orderId: `ORD-${Date.now()}`,
        status: 'Pending',
        estimatedDelivery: new Date(Date.now() + 86400000 * 3).toISOString() // 3 days from now
    };
};

// Keep the old function for backward compatibility if needed, but wrap the new one
export const fetchSupplierPrices = async (supplierId) => {
    const catalog = await fetchSupplierCatalog(supplierId);
    return catalog.map(item => ({
        supplierId,
        productId: item.productId,
        cost: item.cost
    }));
};
