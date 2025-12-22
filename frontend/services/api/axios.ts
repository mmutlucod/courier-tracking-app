import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, ERROR_MESSAGES, STORAGE_KEYS } from '../../utils/constants';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Token alma hatası:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
          await AsyncStorage.removeItem(STORAGE_KEYS.USER);
          throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
        case 404:
          throw new Error(ERROR_MESSAGES.NOT_FOUND);
        case 500:
          throw new Error(ERROR_MESSAGES.SERVER_ERROR);
        default:
          throw new Error((error.response.data as any)?.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    } else if (error.request) {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      throw new Error(error.message || ERROR_MESSAGES.SERVER_ERROR);
    }
  }
);

export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => axiosInstance.get<T>(url, config).then((res) => res.data),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => axiosInstance.post<T>(url, data, config).then((res) => res.data),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => axiosInstance.put<T>(url, data, config).then((res) => res.data),
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => axiosInstance.delete<T>(url, config).then((res) => res.data),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => axiosInstance.patch<T>(url, data, config).then((res) => res.data),
};

export default axiosInstance;