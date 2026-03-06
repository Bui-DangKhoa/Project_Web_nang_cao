import { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_ITEM': {
            const exists = state.find(i => i._id === action.payload._id &&
                i.selectedSize === action.payload.selectedSize &&
                i.selectedColor === action.payload.selectedColor);
            if (exists) {
                return state.map(i => i._id === exists._id && i.selectedSize === exists.selectedSize
                    ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...state, { ...action.payload, qty: 1 }];
        }
        case 'UPDATE_QTY':
            return state.map(i => i._id === action.id && i.selectedSize === action.size
                ? { ...i, qty: Math.max(1, i.qty + action.delta) } : i);
        case 'REMOVE':
            return state.filter(i => !(i._id === action.id && i.selectedSize === action.size));
        case 'CLEAR':
            return [];
        default:
            return state;
    }
};

export const CartProvider = ({ children }) => {
    const [cart, dispatch] = useReducer(cartReducer, []);

    const addToCart = (item) => dispatch({ type: 'ADD_ITEM', payload: item });
    const updateQty = (id, size, delta) => dispatch({ type: 'UPDATE_QTY', id, size, delta });
    const removeItem = (id, size) => dispatch({ type: 'REMOVE', id, size });
    const clearCart = () => dispatch({ type: 'CLEAR' });

    const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQty, removeItem, clearCart, cartTotal, cartCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
