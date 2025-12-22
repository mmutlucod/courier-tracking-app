import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest
} from '../../types/api';
import { IUser } from '../../types/models';
import { API_ENDPOINTS } from '../../utils/constants';
import { apiClient } from './axios';

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
  },

  getMe: async (): Promise<ApiResponse<{ user: IUser }>> => {
    return apiClient.get(API_ENDPOINTS.AUTH.ME);
  },
};