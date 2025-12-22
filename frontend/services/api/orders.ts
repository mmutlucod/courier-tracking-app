import {
  CreateOrderRequest,
  OrderResponse,
  OrdersResponse,
  UpdateOrderStatusRequest,
} from '../../types/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { apiClient } from './axios';

export const ordersApi = {
  create: async (data: CreateOrderRequest): Promise<OrderResponse> => {
    return apiClient.post(API_ENDPOINTS.ORDERS.CREATE, data);
  },

  list: async (): Promise<OrdersResponse> => {
    return apiClient.get(API_ENDPOINTS.ORDERS.LIST);
  },

  getActive: async (): Promise<OrdersResponse> => {
    return apiClient.get(API_ENDPOINTS.ORDERS.ACTIVE);
  },

  deliver: async (id: string) => {
    return apiClient.put(API_ENDPOINTS.ORDERS.DELIVER(id));
  },

  getById: async (id: string): Promise<OrderResponse> => {
    return apiClient.get(API_ENDPOINTS.ORDERS.DETAIL(id));
  },

  assign: async (id: string): Promise<OrderResponse> => {
    return apiClient.put(API_ENDPOINTS.ORDERS.ASSIGN(id));
  },

  updateStatus: async (
    id: string,
    data: UpdateOrderStatusRequest
  ): Promise<OrderResponse> => {
    return apiClient.put(API_ENDPOINTS.ORDERS.UPDATE_STATUS(id), data);
  },

  cancel: async (id: string): Promise<OrderResponse> => {
    return apiClient.delete(API_ENDPOINTS.ORDERS.CANCEL(id));
  },
};
