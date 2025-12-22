import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { authApi } from '../services/api/auth';
import { usersApi } from '../services/api/users';
import { LoginRequest, RegisterRequest, UpdateProfileRequest } from '../types/api';
import { IUser } from '../types/models';
import { STORAGE_KEYS } from '../utils/constants';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  refreshProfile: () => Promise<void>;                            
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (data: LoginRequest) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.login(data);
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Giriş başarısız',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.register(data);
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Kayıt başarısız',
        isLoading: false,
      });
      throw error;
    }
  },
  logout: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });

      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);

      if (token && userStr) {
        const user = JSON.parse(userStr);
        try {
          const response = await authApi.getMe();
          
          set({
            user: response.data?.user || user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          await get().logout();
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.error('Load user error:', error);
      set({ isLoading: false });
    }
  },
  updateProfile: async (data: UpdateProfileRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await usersApi.updateProfile(data);

      const updatedUser = response.user;
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      set({
        user: updatedUser,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Profil güncellenemedi',
        isLoading: false,
      });
      throw error;
    }
  },
  refreshProfile: async () => {
    try {
      const response = await usersApi.getProfile();

      if (response.success && response.user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));

        set({
          user: response.user,
        });
      }
    } catch (error: any) {
      console.error('Refresh profile error:', error);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));