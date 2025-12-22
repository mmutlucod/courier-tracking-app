import {
  AddressResponse,
  AddressesResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '../../types/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { apiClient } from './axios';

export const addressesApi = {
  create: async (data: CreateAddressRequest): Promise<AddressResponse> => {
    return apiClient.post(API_ENDPOINTS.ADDRESSES.CREATE, data);
  },


  list: async (): Promise<AddressesResponse> => {
    return apiClient.get(API_ENDPOINTS.ADDRESSES.LIST);
  },

  getById: async (id: string): Promise<AddressResponse> => {
    return apiClient.get(API_ENDPOINTS.ADDRESSES.DETAIL(id));
  },

  update: async (
    id: string,
    data: UpdateAddressRequest
  ): Promise<AddressResponse> => {
    return apiClient.put(API_ENDPOINTS.ADDRESSES.UPDATE(id), data);
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete(API_ENDPOINTS.ADDRESSES.DELETE(id));
  },
  setDefault: async (id: string): Promise<AddressResponse> => {
    return apiClient.put(API_ENDPOINTS.ADDRESSES.SET_DEFAULT(id));
  },
  getNearby: async (
    lat: number,
    lng: number,
    radius?: number
  ): Promise<AddressesResponse> => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      ...(radius && { radius: radius.toString() }),
    });
    return apiClient.get(`${API_ENDPOINTS.ADDRESSES.NEARBY}?${params}`);
  },
};