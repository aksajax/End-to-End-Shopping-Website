// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        // Initials items local storage se uthayenge taaki refresh par cart khali na ho
        const localData = localStorage.getItem('meesho_cart');
        return localData ? JSON.parse(localData) : [];
    });

    useEffect(() => {
        localStorage.setItem('meesho_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // ➕ Add to Cart
    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const exist = prevItems.find((item) => item.id === product.id);
            if (exist) {
                return prevItems.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    // ➖ Remove or Decrease Quantity
    const removeFromCart = (productId) => {
        setCartItems((prevItems) => {
            const exist = prevItems.find((item) => item.id === productId);
            if (exist.quantity === 1) {
                return prevItems.filter((item) => item.id !== productId);
            }
            return prevItems.map((item) =>
                item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
            );
        });
    };

    // 🗑️ Clear Specific Item completely
    const clearItemFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    };

    // 🧼 Clear Whole Cart
    const clearCart = () => setCartItems([]);

    // 💰 Total Calculations
    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.discount_price || item.price) * item.quantity, 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearItemFromCart, clearCart, getCartTotal, getCartCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);   