import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socketService';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
    // State
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [receiptCounters, setReceiptCounters] = useState({
        boleta: 0,
        factura: 0,
        ticket: 0
    });
    const [loading, setLoading] = useState(false);
    const [supplierProducts, setSupplierProducts] = useState([]);
    const [purchases, setPurchases] = useState([]);

    // Claims & Surveys State (Mock for now)
    const [claims, setClaims] = useState([
        { id: 1, customerId: 1, type: 'Devolución', product: 'Carpa 4 Personas', reason: 'Defecto de fábrica', status: 'Abierto', date: '2023-11-24' },
    ]);
    const [surveys, setSurveys] = useState([
        { id: 1, customerId: 1, rating: 5, comment: 'Excelente servicio', date: '2023-11-21' },
    ]);

    // Load Data from API
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchProducts(),
                fetchSales(),
                fetchCustomers(),
                fetchSuppliers(),
                fetchPurchases(),
                fetchClaims(),
                fetchSurveys()
            ]);
            setLoading(false);
        };
        loadData();

        // Listen for stock updates (connection already initialized in App.jsx)
        const listenerId = socketService.onStockUpdate((data) => {
            console.log('🔄 Actualizando stock en tiempo real:', data);
            
            // Update products state with new stock
            setProducts(prevProducts => 
                prevProducts.map(product => {
                    // Match by ID or name depending on what's available in the update
                    const matchById = product.id === data.productId;
                    const matchByName = product.name === data.productName;
                    
                    if (matchById || matchByName) {
                        return { ...product, stock: data.stock };
                    }
                    return product;
                })
            );
        });

        // Cleanup on unmount
        return () => {
            socketService.offStockUpdate(listenerId);
            // Don't disconnect completely as other components might use it
            // socketService.disconnect();
        };
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/products');
            const data = await res.json();
            if (Array.isArray(data)) {
                setProducts(data);
            } else {
                console.error("Expected array for products, got:", data);
                setProducts([]);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
        }
    };

    const fetchSales = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/sales');
            const data = await res.json();

            if (Array.isArray(data)) {
                setSales(data);

                // Calculate counters based on history
                let b = 0, f = 0, t = 0;
                data.forEach(s => {
                    if (s.receiptNumber && s.receiptNumber.startsWith('B')) b = Math.max(b, parseInt(s.receiptNumber.substring(1)) || 0);
                    if (s.receiptNumber && s.receiptNumber.startsWith('F')) f = Math.max(f, parseInt(s.receiptNumber.substring(1)) || 0);
                    if (s.receiptNumber && s.receiptNumber.startsWith('T')) t = Math.max(t, parseInt(s.receiptNumber.substring(1)) || 0);
                });
                setReceiptCounters({ boleta: b, factura: f, ticket: t });
            } else {
                console.error("Expected array for sales, got:", data);
                setSales([]);
            }

        } catch (error) {
            console.error("Error fetching sales:", error);
            setSales([]);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/customers');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCustomers(data);
            } else {
                console.error("Expected array for customers, got:", data);
                setCustomers([]);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
            setCustomers([]);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/suppliers');
            const data = await res.json();
            if (Array.isArray(data)) {
                setSuppliers(data);
            } else {
                console.error("Expected array for suppliers, got:", data);
                setSuppliers([]);
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            setSuppliers([]);
        }
    };

    const fetchPurchases = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/purchases');
            const data = await res.json();

            if (Array.isArray(data)) {
                // Parse items if they come as string or ensure structure
                const parsedData = data.map(p => ({
                    ...p,
                    items: p.items || [] // items are aggregated as json in query
                }));
                setPurchases(parsedData);
            } else {
                console.error("Expected array for purchases, got:", data);
                setPurchases([]);
            }
        } catch (error) {
            console.error("Error fetching purchases:", error);
            setPurchases([]);
        }
    };

    const fetchClaims = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/claims');
            const data = await res.json();
            if (Array.isArray(data)) {
                setClaims(data);
            } else {
                console.error("Expected array for claims, got:", data);
                setClaims([]);
            }
        } catch (error) {
            console.error("Error fetching claims:", error);
            setClaims([]);
        }
    };

    const fetchSurveys = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/surveys');
            const data = await res.json();
            if (Array.isArray(data)) {
                setSurveys(data);
            } else {
                console.error("Expected array for surveys, got:", data);
                setSurveys([]);
            }
        } catch (error) {
            console.error("Error fetching surveys:", error);
            setSurveys([]);
        }
    };

    // NEW: Fetch all supplier products for product search mode
    const fetchAllSupplierProducts = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/supplier-products');
            if (!res.ok) {
                console.error("Failed to fetch supplier products:", res.status);
                return [];
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                return data;
            } else {
                console.error("Expected array for supplier products, got:", data);
                return [];
            }
        } catch (error) {
            console.error("Error fetching all supplier products:", error);
            return [];
        }
    };

    // --- CART ACTIONS ---
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            const currentQty = existing ? existing.quantity : 0;

            if (currentQty + 1 > product.stock) {
                alert(`Stock insuficiente. Solo quedan ${product.stock} unidades.`);
                return prev;
            }

            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) return;
        setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
    };

    const clearCart = () => setCart([]);

    // --- SALES ACTIONS ---
    const addSale = (saleData) => {
        let prefix = 'T';
        let counterKey = 'ticket';

        if (saleData.receiptType === 'boleta') {
            prefix = 'B';
            counterKey = 'boleta';
        } else if (saleData.receiptType === 'factura') {
            prefix = 'F';
            counterKey = 'factura';
        }

        const newCount = receiptCounters[counterKey] + 1;
        const receiptNumber = `${prefix}${String(newCount).padStart(3, '0')}`;

        setReceiptCounters(prev => ({ ...prev, [counterKey]: newCount }));

        const newSale = {
            ...saleData,
            receiptNumber,
            cartItems: cart // Pass cart items to backend
        };

        // Optimistic Update
        setSales(prev => [newSale, ...prev]);

        // Send to API
        fetch('http://localhost:3000/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSale)
        })
            .then(res => res.json())
            .then(() => {
                fetchProducts(); // Refresh stock
            })
            .catch(err => console.error("Error saving sale:", err));

        return newSale;
    };

    // --- PRODUCT ACTIONS ---
    const addProduct = async (product) => {
        try {
            const res = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            const newProduct = await res.json();
            setProducts(prev => [...prev, newProduct]);
        } catch (err) {
            console.error("Error adding product:", err);
        }
    };

    const updateProduct = async (id, updatedData) => {
        try {
            await fetch(`http://localhost:3000/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
        } catch (err) {
            console.error("Error updating product:", err);
        }
    };

    const deleteProduct = async (id) => {
        try {
            await fetch(`http://localhost:3000/api/products/${id}`, { method: 'DELETE' });
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error("Error deleting product:", err);
        }
    };

    // --- SUPPLIER & PURCHASE ACTIONS ---
    const addSupplier = async (supplier) => {
        try {
            const res = await fetch('http://localhost:3000/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(supplier)
            });
            const newSupplier = await res.json();
            setSuppliers(prev => [...prev, newSupplier]);
        } catch (err) {
            console.error("Error adding supplier:", err);
        }
    };

    const addSupplierProduct = (entry) => {
        setSupplierProducts(prev => {
            const existing = prev.find(sp => sp.supplierId === entry.supplierId && sp.productId === entry.productId);
            if (existing) {
                return prev.map(sp => (sp.supplierId === entry.supplierId && sp.productId === entry.productId) ? entry : sp);
            }
            return [...prev, entry];
        });
    };

    const syncSupplierPrices = async (supplierId) => {
        try {
            console.log(`🔄 Cargando catálogo del proveedor ${supplierId}...`);
            const res = await fetch(`http://localhost:3000/api/supplier-products/${supplierId}`);
            if (!res.ok) {
                console.error('Failed to fetch supplier products:', res.status, await res.text());
                return false;
            }
            const data = await res.json();
            console.log(`📦 Datos recibidos del proveedor ${supplierId}:`, data);

            // Update supplier products with the fetched data
            const formattedProducts = data.map(item => ({
                id: item.id,
                supplierId: item.supplierid,
                productId: item.productid,
                name: item.productname,
                price: parseFloat(item.price),
                stock: parseInt(item.stock),
                category: item.category
            }));

            // Replace existing products for this supplier
            setSupplierProducts(prev => [
                ...prev.filter(sp => sp.supplierId !== parseInt(supplierId)),
                ...formattedProducts
            ]);

            console.log(`✅ Cargados ${formattedProducts.length} productos para proveedor ${supplierId}`);
            return true;
        } catch (error) {
            console.error('❌ Error syncing supplier prices:', error);
            return false;
        }
    };

    const placeSupplierOrder = async (orderData) => {
        try {
            const res = await fetch('http://localhost:3000/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...orderData,
                    status: 'Pending',
                    invoiceNumber: `ORD-${Date.now()}`
                })
            });
            const savedPurchase = await res.json();

            if (savedPurchase.id) {
                // Construct full object for local state
                const newPurchase = {
                    ...orderData,
                    id: savedPurchase.id,
                    date: new Date().toISOString(),
                    status: 'Pending',
                    invoiceNumber: `ORD-${Date.now()}`
                };

                setPurchases(prev => [newPurchase, ...prev]);

                // Also update stock locally if needed, but for Pending we don't update stock yet.
                // We only update stock on Confirm.

                return { success: true, message: "Orden registrada correctamente" };
            } else {
                return { success: false, message: "Error al guardar la orden" };
            }
        } catch (err) {
            console.error("Error placing order:", err);
            return { success: false, message: err.message };
        }
    };

    const addPurchase = (purchase) => {
        // This seems redundant with placeSupplierOrder but kept for compatibility if used elsewhere
        // Ideally should also call API
        console.warn("addPurchase called directly, consider using placeSupplierOrder for full integration");
        const newPurchase = { ...purchase, id: Date.now(), date: new Date().toISOString(), status: 'Pending' };
        setPurchases(prev => [newPurchase, ...prev]);
    };

    const updatePurchaseStatus = async (purchaseId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:3000/api/purchases/${purchaseId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                throw new Error('Failed to update purchase status');
            }

            // Update local purchase status
            setPurchases(prev => prev.map(p => 
                p.id === purchaseId ? { ...p, status: newStatus } : p
            ));

            // If confirmed, reload products from server to get updated stock
            if (newStatus === 'Confirmed') {
                const productsRes = await fetch('http://localhost:3000/api/products');
                const productsData = await productsRes.json();
                setProducts(productsData.map(p => ({
                    ...p,
                    price: parseFloat(p.price),
                    cost: parseFloat(p.cost),
                    stock: parseInt(p.stock),
                    minstock: parseInt(p.minstock)
                })));
                console.log('✅ Inventario actualizado después de confirmar compra');
            }

            return true;
        } catch (error) {
            console.error('Error updating purchase status:', error);
            alert('Error al actualizar el estado de la compra');
            return false;
        }
    };

    // --- CRM ACTIONS ---
    const addCustomer = (customer) => {
        // TODO: Implement API for customers
        setCustomers(prev => [...prev, { ...customer, id: Date.now(), points: 0, totalPurchases: 0, type: 'Nuevo' }]);
    };

    const updateCustomerPoints = (customerId, points) => {
        // TODO: Implement API
        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, points: c.points + points } : c));
    };

    const addClaim = async (claim) => {
        try {
            const res = await fetch('http://localhost:3000/api/claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(claim)
            });
            const newClaim = await res.json();
            setClaims(prev => [newClaim, ...prev]);
        } catch (err) {
            console.error("Error adding claim:", err);
        }
    };

    const updateClaimStatus = (claimId, status, resolution = '') => {
        // TODO: Implement API
        setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status, resolution } : c));
    };

    const value = {
        products, setProducts, addProduct, updateProduct, deleteProduct,
        cart, addToCart, removeFromCart, clearCart, updateQuantity,
        suppliers, setSuppliers, addSupplier,
        supplierProducts, addSupplierProduct, syncSupplierPrices, fetchAllSupplierProducts,
        purchases, addPurchase, placeSupplierOrder, updatePurchaseStatus,
        customers, addCustomer, updateCustomerPoints,
        claims, addClaim, updateClaimStatus,
        surveys,
        sales, addSale,
        loading
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};
