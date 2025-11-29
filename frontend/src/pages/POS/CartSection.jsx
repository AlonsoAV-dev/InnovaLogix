import React from 'react';
import { Trash2, CreditCard } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Button from '../../components/Button';
import './CartSection.css';

const CartSection = ({ onCheckout }) => {
    const { cart, removeFromCart, clearCart } = useStore();

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="cart-section">
            <div className="cart-header">
                <h3 className="cart-title">Orden Actual</h3>
                <span className="cart-count">{cart.length} items</span>
            </div>

            <div className="cart-items">
                {cart.length === 0 ? (
                    <div className="empty-cart">
                        <p>El carrito está vacío</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} className="cart-item">
                            <div className="cart-item-details">
                                <span className="cart-item-name">{item.name}</span>
                                <span className="cart-item-price">
                                    {item.quantity} x S/ {item.price.toFixed(2)}
                                </span>
                            </div>
                            <div className="cart-item-total">
                                <span>S/ {(item.price * item.quantity).toFixed(2)}</span>
                                <button
                                    className="remove-btn"
                                    onClick={() => removeFromCart(item.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="cart-footer">
                <div className="cart-summary">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>S/ {total.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>IGV (18%)</span>
                        <span>S/ {(total * 0.18).toFixed(2)}</span>
                    </div>
                    <div className="summary-row total">
                        <span>Total</span>
                        <span>S/ {(total * 1.18).toFixed(2)}</span>
                    </div>
                </div>

                <div className="cart-actions">
                    <Button
                        variant="outline"
                        fullWidth
                        onClick={clearCart}
                        disabled={cart.length === 0}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        fullWidth
                        icon={CreditCard}
                        disabled={cart.length === 0}
                        onClick={onCheckout}
                    >
                        Pagar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CartSection;
