import React from 'react';
import { useStore } from '../../context/StoreContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Plus } from 'lucide-react';
import './ProductGrid.css';

const ProductGrid = ({ products }) => {
    const { addToCart } = useStore();

    return (
        <div className="product-grid">
            {products.map(product => (
                <Card key={product.id} className="product-card">
                    <div className="product-image-placeholder">
                        {/* Placeholder for product image */}
                        <span>{product.name.charAt(0)}</span>
                    </div>
                    <div className="product-info">
                        <h4 className="product-name">{product.name}</h4>
                        <p className="product-category">{product.category}</p>
                        <div className="product-footer">
                            <span className="product-price">S/ {product.price.toFixed(2)}</span>
                            <span className="product-stock" style={{ fontSize: '0.8em', color: '#666' }}>Stock: {product.stock}</span>
                            <Button
                                size="small"
                                variant="secondary"
                                icon={Plus}
                                onClick={() => addToCart(product)}
                                disabled={product.stock <= 0}
                            >
                                {product.stock > 0 ? 'Agregar' : 'Agotado'}
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default ProductGrid;
