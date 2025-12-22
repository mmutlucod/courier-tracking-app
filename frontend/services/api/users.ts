import {
  CouriersResponse,
  UpdateAvailabilityRequest,
  UpdateProfileRequest,
} from '../../types/api';
import { IUser } from '../../types/models';
import { API_ENDPOINTS } from '../../utils/constants';
import { apiClient } from './axios';

export const usersApi = {
  getProfile: async () => {
    return apiClient.get(API_ENDPOINTS.USERS.PROFILE);
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    return apiClient.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, data);
  },

  updateAvailability: async (data: UpdateAvailabilityRequest) => {
    return apiClient.put(API_ENDPOINTS.USERS.AVAILABILITY, data);
  },

  getCourierById: async (id: string): Promise<{ success: boolean; courier: IUser }> => {
    return apiClient.get(API_ENDPOINTS.USERS.COURIER(id));
  },

  getAllCouriers: async (available?: boolean): Promise<CouriersResponse> => {
    const params = available !== undefined ? `?available=${available}` : '';
    return apiClient.get(`${API_ENDPOINTS.USERS.COURIERS}${params}`);
  },
};