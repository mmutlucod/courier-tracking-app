import { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadUser,
    updateProfile,
    refreshProfile,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,      
    refreshProfile,    
    clearError,
    isCourier: user?.role === 'courier',
    isCustomer: user?.role === 'customer',
  };
};