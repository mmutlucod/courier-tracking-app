
import { useEffect } from 'react';
import courierSocketService, {
  CourierLocationData,
  CourierStatusData,
} from '../services/socket/courier-socket';
import { useSocket } from './useSocket';

export const useCourierSocket = () => {
  const { isConnected } = useSocket();

  const sendLocation = (data: CourierLocationData) => {
    if (isConnected) {
      courierSocketService.sendLocation(data);
    }
  };

  const startDelivery = (data: CourierStatusData) => {
    if (isConnected) {
      courierSocketService.startDelivery(data);
    }
  };

  const stopDelivery = (data: CourierStatusData) => {
    if (isConnected) {
      courierSocketService.stopDelivery(data);
    }
  };

  useEffect(() => {
    return () => {
      courierSocketService.removeListeners();
    };
  }, []);

  return {
    isConnected,
    sendLocation,
    startDelivery,
    stopDelivery,
    onCourierUpdate: courierSocketService.onCourierUpdate.bind(courierSocketService),
    onCourierStatus: courierSocketService.onCourierStatus.bind(courierSocketService),
    onError: courierSocketService.onError.bind(courierSocketService),
  };
};