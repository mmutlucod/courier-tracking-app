
import {
  LocationResponse,
  LocationsResponse,
  SaveLocationRequest,
} from '../../types/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { apiClient } from './axios';

export const locationsApi = {
  save: async (data: SaveLocationRequest): Promise<LocationResponse> => {
    return apiClient.post(API_ENDPOINTS.LOCATIONS.SAVE, data);
  },

  getCourierHistory: async (
    courierId: string,
    limit?: number,
    orderId?: string
  ): Promise<LocationsResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (orderId) params.append('orderId', orderId);
    
    return apiClient.get(
      `${API_ENDPOINTS.LOCATIONS.COURIER(courierId)}?${params.toString()}`
    );
  },

  getLatest: async (courierId: string): Promise<LocationResponse> => {
    return apiClient.get(API_ENDPOINTS.LOCATIONS.LATEST(courierId));
  },

  getNearby: async (
    lat: number,
    lng: number,
    radius?: number
  ): Promise<LocationsResponse> => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    if (radius) params.append('radius', radius.toString());
    
    return apiClient.get(`${API_ENDPOINTS.LOCATIONS.NEARBY}?${params.toString()}`);
  },
};