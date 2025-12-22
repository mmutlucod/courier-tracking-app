import { useEffect } from 'react';
import customerSocketService, {
  TrackOrderData,
  UntrackData,
} from '../services/socket/customer-socket';
import { useSocket } from './useSocket';

export const useCustomerSocket = () => {
  const { isConnected } = useSocket();

  const trackOrder = (data: TrackOrderData) => {
    if (isConnected) {
      customerSocketService.trackOrder(data);
    }
  };

  const untrackOrder = (data: UntrackData) => {
    if (isConnected) {
      customerSocketService.untrackOrder(data);
    }
  };

  useEffect(() => {
    return () => {
      customerSocketService.removeListeners();
    };
  }, []);

  return {
    isConnected,
    trackOrder,
    untrackOrder,
    onCourierFound: customerSocketService.onCourierFound.bind(customerSocketService),
    onLocationUpdate: customerSocketService.onLocationUpdate.bind(customerSocketService),
    onCourierUpdate: customerSocketService.onCourierUpdate.bind(customerSocketService),
    onError: customerSocketService.onError.bind(customerSocketService),
  };
};