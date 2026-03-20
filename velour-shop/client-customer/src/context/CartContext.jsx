import { createContext, useContext, useEffect, useReducer } from "react";
import { userAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

const CART_STORAGE_KEY = "velour_guest_cart";

const parseStoredCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM": {
      const exists = state.find(
        (i) =>
          i._id === action.payload._id &&
          i.selectedSize === action.payload.selectedSize &&
          i.selectedColor === action.payload.selectedColor,
      );
      if (exists) {
        return state.map((i) =>
          i._id === exists._id && i.selectedSize === exists.selectedSize
            ? { ...i, qty: i.qty + 1 }
            : i,
        );
      }
      return [...state, { ...action.payload, qty: 1 }];
    }
    case "UPDATE_QTY":
      return state.map((i) =>
        i._id === action.id && i.selectedSize === action.size
          ? { ...i, qty: Math.max(1, i.qty + action.delta) }
          : i,
      );
    case "REMOVE":
      return state.filter(
        (i) => !(i._id === action.id && i.selectedSize === action.size),
      );
    case "CLEAR":
      return [];
    case "SET_CART":
      return Array.isArray(action.payload) ? action.payload : state;
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, dispatch] = useReducer(cartReducer, [], parseStoredCart);

  const addToCart = (item) => dispatch({ type: "ADD_ITEM", payload: item });
  const updateQty = (id, size, delta) =>
    dispatch({ type: "UPDATE_QTY", id, size, delta });
  const removeItem = (id, size) => dispatch({ type: "REMOVE", id, size });
  const clearCart = () => dispatch({ type: "CLEAR" });

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  // Guest cart uses localStorage.
  useEffect(() => {
    if (user) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, user]);

  // Login: merge guest cart into server cart once.
  useEffect(() => {
    let cancelled = false;

    const hydrateUserCart = async () => {
      if (!user) return;

      const guestCart = parseStoredCart();
      const { data } = await userAPI.getCart();
      const dbCart = (data.cart || [])
        .map((item) => ({
          ...(item.product || {}),
          _id: item.product?._id,
          qty: item.qty,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        }))
        .filter((item) => item._id);

      const mergedMap = new Map();
      [...dbCart, ...guestCart].forEach((item) => {
        const key = `${item._id}-${item.selectedSize || ""}-${item.selectedColor || ""}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, {
            ...item,
            qty: Math.max(1, Number(item.qty) || 1),
          });
        } else {
          const prev = mergedMap.get(key);
          mergedMap.set(key, {
            ...prev,
            qty: prev.qty + (Number(item.qty) || 1),
          });
        }
      });

      const mergedCart = [...mergedMap.values()];
      if (!cancelled) {
        dispatch({ type: "SET_CART", payload: mergedCart });
      }

      await userAPI.syncCart(
        mergedCart.map((item) => ({
          product: item._id,
          qty: item.qty,
          selectedSize: item.selectedSize || "",
          selectedColor: item.selectedColor || "",
        })),
      );

      localStorage.removeItem(CART_STORAGE_KEY);
    };

    hydrateUserCart().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Sync cart changes to DB for logged-in user.
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      userAPI
        .syncCart(
          cart.map((item) => ({
            product: item._id,
            qty: item.qty,
            selectedSize: item.selectedSize || "",
            selectedColor: item.selectedColor || "",
          })),
        )
        .catch(() => undefined);
    }, 300);

    return () => clearTimeout(timer);
  }, [cart, user]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
