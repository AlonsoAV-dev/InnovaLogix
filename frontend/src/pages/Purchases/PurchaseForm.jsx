import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, RefreshCw, ShoppingCart, Search } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import './PurchaseForm.css';

const PurchaseForm = ({ onComplete }) => {
    const { suppliers, products, placeSupplierOrder, supplierProducts, syncSupplierPrices, fetchAllSupplierProducts } = useStore();
    const [searchMode, setSearchMode] = useState('supplier'); // 'supplier' or 'product'
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState([]);
    const [currentItem, setCurrentItem] = useState({ productId: '', quantity: 1, cost: '', supplierId: '' });
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
    const [catalogConnected, setCatalogConnected] = useState(false);

    // Product search mode state
    const [productSearch, setProductSearch] = useState('');
    const [allSupplierProducts, setAllSupplierProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedSupplierForProduct, setSelectedSupplierForProduct] = useState('');

    // Load all supplier products when switching to product mode
    useEffect(() => {
        if (searchMode === 'product') {
            const loadAllProducts = async () => {
                const data = await fetchAllSupplierProducts();
                setAllSupplierProducts(data);
            };
            loadAllProducts();
        }
    }, [searchMode]);


    // Filter products available for the selected supplier
    const availableProducts = supplierId
        ? supplierProducts.filter(sp => sp.supplierId === parseInt(supplierId)).map(sp => {
            const localProduct = products.find(p => p.id === sp.productId);
            return {
                id: sp.productId,
                name: sp.name || (localProduct ? localProduct.name : `Producto #${sp.productId}`),
                cost: sp.price,
                stock: sp.stock
            };
        })
        : [];

    // Get unique products for search
    const uniqueProducts = Array.from(
        new Map(allSupplierProducts.map(sp => [sp.productname, sp])).values()
    );

    // Filter products by search term
    const filteredProducts = productSearch
        ? uniqueProducts.filter(p =>
            p.productname.toLowerCase().includes(productSearch.toLowerCase())
        )
        : [];

    // Get suppliers for selected product
    const suppliersForProduct = selectedProduct
        ? allSupplierProducts.filter(sp => sp.productname === selectedProduct.productname)
        : [];

    const handleProductChange = (e) => {
        const prodId = parseInt(e.target.value);
        const product = availableProducts.find(p => p.id === prodId);

        setCurrentItem({
            ...currentItem,
            productId: prodId,
            cost: product ? product.cost : ''
        });
    };

    const handleAddItem = () => {
        if (!currentItem.productId || !currentItem.quantity || !currentItem.cost) return;

        const product = availableProducts.find(p => p.id === parseInt(currentItem.productId));
        const requestedQty = parseInt(currentItem.quantity);

        // Check stock limit
        if (product && requestedQty > product.stock) {
            alert(`No hay suficiente stock disponible (Stock: ${product.stock})`);
            return;
        }

        // Check if already added
        const existingItem = items.find(i => i.productId === parseInt(currentItem.productId));
        if (existingItem) {
            alert("Este producto ya está en la lista");
            return;
        }

        setItems([...items, { ...currentItem }]);
        setCurrentItem({ productId: '', quantity: 1, cost: '' });
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleConnectCatalog = async () => {
        if (!supplierId) return;
        setIsLoadingCatalog(true);
        const success = await syncSupplierPrices(supplierId);
        setIsLoadingCatalog(false);
        if (success) {
            setCatalogConnected(true);
        } else {
            alert("No se pudo conectar con el catálogo del proveedor");
        }
    };

    // Product search mode handlers
    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setSelectedSupplierForProduct('');
    };

    const handleSupplierSelectForProduct = (supplierProductData) => {
        setSelectedSupplierForProduct(supplierProductData.supplierid);
        setCurrentItem({
            productId: supplierProductData.productid,
            quantity: 1,
            cost: supplierProductData.price,
            supplierId: supplierProductData.supplierid
        });
    };

    const handleAddItemFromProductSearch = () => {
        if (!currentItem.productId || !currentItem.quantity || !currentItem.cost || !currentItem.supplierId) return;

        const supplierProductData = allSupplierProducts.find(
            sp => sp.productid === currentItem.productId && sp.supplierid === currentItem.supplierId
        );

        if (!supplierProductData) return;

        const requestedQty = parseInt(currentItem.quantity);

        // Check stock limit
        if (requestedQty > supplierProductData.stock) {
            alert(`No hay suficiente stock disponible (Stock: ${supplierProductData.stock})`);
            return;
        }

        // Check if already added
        const existingItem = items.find(
            i => i.productId === parseInt(currentItem.productId) && i.supplierId === currentItem.supplierId
        );
        if (existingItem) {
            alert("Este producto de este proveedor ya está en la lista");
            return;
        }

        setItems([...items, { ...currentItem }]);
        setCurrentItem({ productId: '', quantity: 1, cost: '', supplierId: '' });
        setSelectedProduct(null);
        setProductSearch('');
    };


    const handleSubmit = async () => {
        // Determine the effective supplier ID. 
        // In 'supplier' mode, it's the selected supplierId.
        // In 'product' mode, we take it from the first item (assuming single-supplier order for now).
        const effectiveSupplierId = supplierId || (items.length > 0 ? items[0].supplierId : '');

        if ((!effectiveSupplierId) || items.length === 0) return;

        const supplier = suppliers.find(s => s.id === parseInt(effectiveSupplierId));
        const total = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

        const result = await placeSupplierOrder({
            supplierId: parseInt(effectiveSupplierId),
            supplierName: supplier ? supplier.name : 'Proveedor Desconocido',
            items: items.map(item => {
                const product = availableProducts.find(p => p.id === parseInt(item.productId)) ||
                    allSupplierProducts.find(p => p.productid === parseInt(item.productId));
                return {
                    ...item,
                    productId: parseInt(item.productId),
                    productName: product ? (product.name || product.productname) : 'Producto Desconocido',
                    quantity: parseInt(item.quantity),
                    cost: parseFloat(item.cost)
                };
            }),
            total
        });

        if (result.success) {
            alert(`${result.message} - Proveedor: ${supplier ? supplier.name : 'Proveedor Desconocido'}`);
            onComplete();
        } else {
            alert("Error al procesar la orden: " + result.message);
        }
    };

    return (
        <div className="purchase-form">
            {/* Mode Toggle */}
            <div className="mode-toggle">
                <button
                    className={`mode-btn ${searchMode === 'supplier' ? 'active' : ''}`}
                    onClick={() => {
                        setSearchMode('supplier');
                        setSelectedProduct(null);
                        setProductSearch('');
                    }}
                >
                    Buscar por Proveedor
                </button>
                <button
                    className={`mode-btn ${searchMode === 'product' ? 'active' : ''}`}
                    onClick={() => {
                        setSearchMode('product');
                        setSupplierId('');
                        setItems([]);
                        setCatalogConnected(false);
                    }}
                >
                    Buscar por Producto
                </button>
            </div>

            {/* Supplier Mode */}
            {searchMode === 'supplier' && (
                <>
                    <div className="form-section">
                        <h4>Detalles de Compra</h4>
                        <div className="supplier-select-row">
                            <div className="supplier-select-container">
                                <label>Proveedor</label>
                                <select
                                    value={supplierId}
                                    onChange={e => {
                                        setSupplierId(e.target.value);
                                        setItems([]);
                                        setCatalogConnected(false);
                                    }}
                                    className="custom-select"
                                >
                                    <option value="">Seleccionar Proveedor</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                onClick={handleConnectCatalog}
                                disabled={!supplierId || isLoadingCatalog}
                                className={catalogConnected ? "btn-connected" : ""}
                                icon={isLoadingCatalog ? RefreshCw : (catalogConnected ? ShoppingCart : RefreshCw)}
                            >
                                {isLoadingCatalog ? 'Conectando...' : (catalogConnected ? 'Catálogo Conectado' : 'Conectar Catálogo')}
                            </Button>
                        </div>

                        <div className="form-section">
                            <h4>Agregar Productos</h4>
                            <div className="add-item-row">
                                <select
                                    value={currentItem.productId}
                                    onChange={handleProductChange}
                                    className="custom-select product-select"
                                    disabled={!catalogConnected}
                                >
                                    <option value="">{catalogConnected ? 'Seleccionar Producto del Catálogo' : 'Conecte primero al catálogo'}</option>
                                    {availableProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>

                                <Input
                                    type="number"
                                    placeholder="Cant."
                                    value={currentItem.quantity}
                                    onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                                    className="qty-input"
                                />

                                <Input
                                    type="number"
                                    placeholder="Costo Unit."
                                    value={currentItem.cost}
                                    readOnly
                                    className="cost-input disabled-input"
                                    title="El costo es determinado por el proveedor"
                                />

                                <Button icon={Plus} onClick={handleAddItem} disabled={!currentItem.productId}>
                                    Agregar
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Product Search Mode */}
            {searchMode === 'product' && (
                <div className="form-section">
                    <h4>Buscar Producto</h4>
                    <div className="product-search-container">
                        <div className="search-input-wrapper">
                            <Search size={20} className="search-icon" />
                            <Input
                                id="product-search-input"
                                type="text"
                                placeholder="Buscar producto por nombre..."
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                                className="product-search-input"
                            />
                        </div>

                        {/* Product Search Results */}
                        {productSearch && filteredProducts.length > 0 && !selectedProduct && (
                            <div className="search-results">
                                <h5>Resultados ({filteredProducts.length})</h5>
                                <div className="product-list">
                                    {filteredProducts.slice(0, 10).map((product, idx) => (
                                        <div
                                            key={idx}
                                            className="product-item"
                                            onClick={() => handleProductSelect(product)}
                                        >
                                            <span className="product-name">{product.productname}</span>
                                            <span className="product-category">{product.category}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Supplier Options for Selected Product */}
                        {selectedProduct && (
                            <div className="supplier-options">
                                <h5>Proveedores para: {selectedProduct.productname}</h5>
                                <div className="supplier-cards">
                                    {suppliersForProduct.map((sp, idx) => (
                                        <div
                                            key={idx}
                                            className={`supplier-card ${selectedSupplierForProduct === sp.supplierid ? 'selected' : ''}`}
                                            onClick={() => handleSupplierSelectForProduct(sp)}
                                        >
                                            <div className="supplier-name">{sp.suppliername}</div>
                                            <div className="supplier-details">
                                                <span className="price">S/ {sp.price.toFixed(2)}</span>
                                                <span className="stock">Stock: {sp.stock}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedSupplierForProduct && (
                                    <div className="add-item-row">
                                        <Input
                                            type="number"
                                            placeholder="Cantidad"
                                            value={currentItem.quantity}
                                            onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                                            className="qty-input"
                                        />
                                        <Button icon={Plus} onClick={handleAddItemFromProductSearch}>
                                            Agregar a Orden
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setSelectedProduct(null);
                                                setProductSearch('');
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="items-list">
                <h4>Productos en la Orden</h4>
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Proveedor</th>
                            <th>Cantidad</th>
                            <th>Costo Unit.</th>
                            <th>Subtotal</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const product = availableProducts.find(p => p.id === parseInt(item.productId));
                            const itemSupplier = suppliers.find(s => s.id === parseInt(item.supplierId));
                            return (
                                <tr key={index}>
                                    <td>{product ? product.name : `ID: ${item.productId}`}</td>
                                    <td>{itemSupplier ? itemSupplier.name : 'Desconocido'}</td>
                                    <td>{item.quantity}</td>
                                    <td>S/ {parseFloat(item.cost).toFixed(2)}</td>
                                    <td>S/ {(item.quantity * item.cost).toFixed(2)}</td>
                                    <td>
                                        <button className="icon-button delete" onClick={() => handleRemoveItem(index)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {items.length > 0 && (
                    <div className="order-total">
                        <strong>Total Estimado: S/ {items.reduce((sum, item) => sum + (item.quantity * item.cost), 0).toFixed(2)}</strong>
                    </div>
                )}
            </div>

            <div className="form-actions">
                <Button variant="secondary" onClick={onComplete}>Cancelar</Button>
                <Button variant="primary" icon={Save} onClick={handleSubmit} disabled={items.length === 0}>
                    Registrar Compra
                </Button>
            </div>
        </div>
    );
};

export default PurchaseForm;
