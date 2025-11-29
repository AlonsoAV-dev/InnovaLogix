import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import './ProductModal.css';

const ProductModal = ({ isOpen, onClose, product, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        cost: '',
        stock: ''
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                category: product.category,
                price: product.price,
                cost: product.cost || '',
                stock: product.stock
            });
        } else {
            setFormData({
                name: '',
                category: '',
                price: '',
                cost: '',
                stock: ''
            });
        }
    }, [product, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        const price = parseFloat(formData.price);
        const cost = parseFloat(formData.cost);

        if (cost >= price) {
            alert('El costo de compra debe ser menor que el precio de venta.');
            return;
        }

        onSave({
            ...product, // Keep ID if editing
            name: formData.name,
            category: formData.category,
            price: price,
            cost: cost,
            stock: parseInt(formData.stock)
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content product-modal">
                <div className="modal-header">
                    <h2 className="modal-title">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <Input
                        label="Nombre del Producto"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        fullWidth
                    />

                    <Input
                        label="Categoría"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        fullWidth
                    />

                    <div className="form-row">
                        <Input
                            label="Precio Venta (S/)"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                            fullWidth
                        />

                        <Input
                            label="Costo Compra (S/)"
                            type="number"
                            step="0.01"
                            value={formData.cost}
                            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                            required
                            fullWidth
                        />
                    </div>

                    <div className="form-row">
                        <Input
                            label="Stock Inicial"
                            type="number"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            required
                            fullWidth
                        />
                    </div>

                    <div className="modal-footer">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" variant="primary">Guardar Producto</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
