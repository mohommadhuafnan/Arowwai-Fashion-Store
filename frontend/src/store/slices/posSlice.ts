import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  tax: number;
  variant?: { size?: string; color?: string; sku?: string };
  image?: string;
}

interface POSState {
  cart: CartItem[];
  customer: { _id: string; firstName: string; lastName?: string; phone: string; loyaltyPoints?: number } | null;
  discount: number;
  discountNote: string;
  couponCode: string;
  taxRate: number;
  paymentMethod: string;
  splitPayments: { method: string; amount: number }[];
}

const initialState: POSState = {
  cart: [],
  customer: null,
  discount: 0,
  discountNote: '',
  couponCode: '',
  taxRate: 18,
  paymentMethod: 'cash',
  splitPayments: [],
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.cart.find((i) => i.productId === action.payload.productId && i.variant?.sku === action.payload.variant?.sku);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.cart.push(action.payload);
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter((i) => i.productId !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.cart.find((i) => i.productId === action.payload.productId);
      if (item) item.quantity = Math.max(1, action.payload.quantity);
    },
    setCustomer: (state, action: PayloadAction<POSState['customer']>) => {
      state.customer = action.payload;
    },
    setDiscount: (state, action: PayloadAction<number>) => {
      state.discount = action.payload;
    },
    setDiscountNote: (state, action: PayloadAction<string>) => {
      state.discountNote = action.payload;
    },
    setCouponCode: (state, action: PayloadAction<string>) => {
      state.couponCode = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethod = action.payload;
    },
    clearCart: (state) => {
      state.cart = [];
      state.customer = null;
      state.discount = 0;
      state.discountNote = '';
      state.couponCode = '';
      state.splitPayments = [];
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, setCustomer, setDiscount, setDiscountNote, setCouponCode, setPaymentMethod, clearCart } = posSlice.actions;

export const selectCartSubtotal = (state: { pos: POSState }) =>
  state.pos.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

export const selectCartTotal = (state: { pos: POSState }) => {
  const subtotal = selectCartSubtotal(state);
  const afterDiscount = subtotal - state.pos.discount;
  const tax = afterDiscount * (state.pos.taxRate / 100);
  return afterDiscount + tax;
};

export default posSlice.reducer;
