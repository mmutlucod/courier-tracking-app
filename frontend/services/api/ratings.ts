import {
  CreateRatingRequest,
  RatingsResponse,
} from '../../types/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { apiClient } from './axios';

export const ratingsApi = {
  create: async (data: CreateRatingRequest) => {
    return apiClient.post(API_ENDPOINTS.RATINGS.CREATE, data);
  },

  getCourierRatings: async (
    courierId: string,
    limit?: number
  ): Promise<RatingsResponse> => {
    const params = limit ? `?limit=${limit}` : '';
    return apiClient.get(`${API_ENDPOINTS.RATINGS.COURIER(courierId)}${params}`);
  },

  getOrderRating: async (orderId: string) => {
    return apiClient.get(API_ENDPOINTS.RATINGS.ORDER(orderId));
  },

  getMyRatings: async (): Promise<RatingsResponse> => {
    return apiClient.get(API_ENDPOINTS.RATINGS.MY);
  },
}