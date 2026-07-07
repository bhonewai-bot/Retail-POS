"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";

export interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  discount: number;
  taxRate: number;
}

export type CartAction =
  | { type: "ADD_ITEM"; product: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; id: number }
  | { type: "INCREMENT"; id: number }
  | { type: "DECREMENT"; id: number }
  | { type: "SET_QUANTITY"; id: number; quantity: number }
  | { type: "SET_DISCOUNT"; discount: number }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.product.id);
      if (existing) {
        if (existing.quantity >= existing.stock) return state;
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.product, quantity: 1 }],
      };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "INCREMENT":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id && i.quantity < i.stock
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      };
    case "DECREMENT":
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.id === action.id ? { ...i, quantity: i.quantity - 1 } : i
          )
          .filter((i) => i.quantity > 0),
      };
    case "SET_QUANTITY":
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id
            ? { ...i, quantity: Math.min(action.quantity, i.stock) }
            : i
        ),
      };
    case "SET_DISCOUNT":
      return { ...state, discount: Math.max(0, action.discount) };
    case "CLEAR":
      return { ...state, items: [], discount: 0 };
    default:
      return state;
  }
}

const initialState: CartState = {
  items: [],
  discount: 0,
  taxRate: 0.08,
};

interface CartContextValue {
  state: CartState;
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  dispatch: React.Dispatch<CartAction>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountedSubtotal = Math.max(0, subtotal - state.discount);
  const tax = discountedSubtotal * state.taxRate;
  const total = discountedSubtotal + tax;
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ state, subtotal, tax, total, itemCount, dispatch }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
