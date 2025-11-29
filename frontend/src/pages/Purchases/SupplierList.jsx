import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import './SupplierList.css';

const SupplierList = () => {
    const { suppliers, addSupplier, products, supplierProducts, addSupplierProduct, syncSupplierPrices } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ ruc: '', name: '', contact: '', phone: '', email: '' });
    const [syncingId, setSyncingId] = useState(null);

    // Manage Products Modal State
    const [managingSupplier, setManagingSupplier] = useState(null);
    const [productForm, setProductForm] = useState({ productId: '', cost: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        addSupplier(newSupplier);
        setIsAdding(false);
        setNewSupplier({ ruc: '', name: '', contact: '', phone: '', email: '' });
    };

    const handleSync = async (supplierId) => {
        setSyncingId(supplierId);
        await syncSupplierPrices(supplierId);
        setSyncingId(null);
    };

    const handleAddProductToSupplier = (e) => {
        e.preventDefault();
        if (!managingSupplier || !productForm.productId || !productForm.cost) return;

        addSupplierProduct({
            supplierId: managingSupplier.id,
            productId: parseInt(productForm.productId),
            cost: parseFloat(productForm.cost)
        });
        setProductForm({ productId: '', cost: '' });
    };

    const getSupplierProducts = (supplierId) => {
        return supplierProducts.filter(sp => sp.supplierId === supplierId).map(sp => {
            const product = products.find(p => p.id === sp.productId);
            return { ...sp, productName: product ? product.name : 'Unknown' };
        });
    };

    return (
        <div className="supplier-list">
            <div className="list-header">
                <h3>Directorio de Proveedores</h3>
                {!isAdding && (
                    <Button icon={Plus} size="small" onClick={() => setIsAdding(true)}>
                        Nuevo Proveedor
                    </Button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="add-supplier-form">
                    <div className="form-grid">
                        <Input
                            placeholder="RUC"
                            value={newSupplier.ruc}
                            onChange={e => setNewSupplier({ ...newSupplier, ruc: e.target.value })}
                            required
                        />
                        <Input
                            placeholder="Empresa"
                            value={newSupplier.name}
                            onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                            required
                        />
                        <Input
                            placeholder="Contacto"
                            value={newSupplier.contact}
                            onChange={e => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                            required
                        />
                        <Input
                            placeholder="Teléfono"
                            value={newSupplier.phone}
                            onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                        />
                        <Input
                            placeholder="Email"
                            value={newSupplier.email}
                            onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
                        />
                    </div>
                    <div className="form-actions">
                        <Button variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
                        <Button type="submit">Guardar</Button>
                    </div>
                </form>
            )}

            <table className="inventory-table">
                <thead>
                    <tr>
                        <th>RUC</th>
                        <th>Empresa</th>
                        <th>Contacto</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.map(supplier => (
                        <tr key={supplier.id}>
                            <td>{supplier.ruc}</td>
                            <td className="font-medium">{supplier.name}</td>
                            <td>{supplier.contact}</td>
                            <td>{supplier.phone}</td>
                            <td>{supplier.email}</td>
                            <td>
                                <div className="action-buttons">
                                    <Button
                                        size="small"
                                        variant="ghost"
                                        icon={Package}
                                        onClick={() => setManagingSupplier(supplier)}
                                        title="Gestionar Productos"
                                    />
                                    <Button
                                        size="small"
                                        variant="ghost"
                                        icon={RefreshCw}
                                        onClick={() => handleSync(supplier.id)}
                                        title="Sincronizar Precios"
                                        className={syncingId === supplier.id ? 'spin' : ''}
                                        disabled={syncingId === supplier.id}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {managingSupplier && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Productos de {managingSupplier.name}</h3>
                            <button className="close-btn" onClick={() => setManagingSupplier(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleAddProductToSupplier} className="add-product-row">
                                <select
                                    value={productForm.productId}
                                    onChange={e => setProductForm({ ...productForm, productId: e.target.value })}
                                    className="custom-select"
                                    required
                                >
                                    <option value="">Seleccionar Producto</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <Input
                                    type="number"
                                    placeholder="Costo Pactado"
                                    value={productForm.cost}
                                    onChange={e => setProductForm({ ...productForm, cost: e.target.value })}
                                    required
                                    style={{ width: '120px' }}
                                />
                                <Button type="submit" icon={Plus} size="small">Asignar</Button>
                            </form>

                            <table className="inventory-table mt-4">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Costo Acordado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getSupplierProducts(managingSupplier.id).map((sp, idx) => (
                                        <tr key={idx}>
                                            <td>{sp.productName}</td>
                                            <td>S/ {sp.cost.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {getSupplierProducts(managingSupplier.id).length === 0 && (
                                        <tr><td colSpan="2" className="text-center text-muted">No hay productos asignados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierList;
