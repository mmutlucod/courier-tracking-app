import { create } from 'zustand';
import { ordersApi } from '../services/api/orders';
import { CreateOrderRequest } from '../types/api';
import { IOrder, OrderStatus } from '../types/models';

interface OrderState {
  orders: IOrder[];
  activeOrders: IOrder[];
  currentOrder: IOrder | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrders: () => Promise<void>;
  fetchActiveOrders: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  deliverOrder: (id: string) => Promise<void>;
  createOrder: (data: CreateOrderRequest) => Promise<IOrder>;
  assignOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  clearError: () => void;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  activeOrders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await ordersApi.list();

      set({
        orders: response.orders,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Siparişler yüklenemedi',
        isLoading: false,
      });
    }
  },
  deliverOrder: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await ordersApi.deliver(id);
      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? response.order : o)),
        currentOrder: state.currentOrder?._id === id ? response.order : state.currentOrder,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Sipariş teslim edilemedi', isLoading: false });
      throw error;
    }
  },

  fetchActiveOrders: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await ordersApi.getActive();

      set({
        activeOrders: response.orders,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Aktif siparişler yüklenemedi',
        isLoading: false,
      });
    }
  },

  fetchOrderById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await ordersApi.getById(id);

      set({
        currentOrder: response.order,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Sipariş yüklenemedi',
        isLoading: false,
      });
    }
  },
  createOrder: async (data: CreateOrderRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await ordersApi.create(data);

      set((state) => ({
        orders: [response.order, ...state.orders],
        currentOrder: response.order,
        isLoading: false,
      }));

      return response.order;
    } catch (error: any) {
      set({
        error: error.message || 'Sipariş oluşturulamadı',
        isLoading: false,
      });
      throw error;
    }
  },

assignOrder: async (id: string) => {
  try {
    set({ isLoading: true, error: null });
    const response = await ordersApi.assign(id);
    set((state) => ({
      activeOrders: state.activeOrders.filter((o) => o._id !== id),
      orders: [response.order, ...state.orders],
      currentOrder: response.order,
      isLoading: false,
    }));
  } catch (error: any) {
    set({
      error: error.message || 'Sipariş kabul edilemedi',
      isLoading: false,
    });
    throw error;
  }
},
  updateOrderStatus: async (id: string, status: OrderStatus) => {
    try {
      set({ isLoading: true, error: null });

      const response = await ordersApi.updateStatus(id, { status });

      set((state) => ({
        orders: state.orders.map((o) =>
          o._id === id ? response.order : o
        ),
        currentOrder:
          state.currentOrder?._id === id
            ? response.order
            : state.currentOrder,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Durum güncellenemedi',
        isLoading: false,
      });
      throw error;
    }
  },

  cancelOrder: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await ordersApi.cancel(id);
      set((state) => ({
        orders: state.orders.map((o) =>
          o._id === id ? response.order : o
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Sipariş iptal edilemedi',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null });
  },
}));