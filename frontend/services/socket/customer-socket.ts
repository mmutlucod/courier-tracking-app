import { SOCKET_EVENTS } from '../../utils/constants';
import socketService from './socket';

interface TrackOrderData {
  orderId: string;
  customerId?: string;
}

interface UntrackData {
  courierId: string;
}

interface CourierFoundData {
  courierId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  speed: number;
  eta: number;
  distance: string;
}

interface LocationUpdateData {
  courierId: string;
  lat: number;
  lng: number;
  speed: number;
  timestamp: number;
}

class CustomerSocketService {
  trackOrder(data: TrackOrderData): void {
    socketService.emit(SOCKET_EVENTS.CUSTOMER_TRACK, data);
  }

  untrackOrder(data: UntrackData): void {
    socketService.emit(SOCKET_EVENTS.CUSTOMER_UNTRACK, data);
  }

  onCourierFound(callback: (data: CourierFoundData) => void): void {
    socketService.on(SOCKET_EVENTS.COURIER_FOUND, callback);
  }

  onLocationUpdate(callback: (data: LocationUpdateData) => void): void {
    socketService.on(SOCKET_EVENTS.LOCATION_UPDATE, callback);
  }

  onCourierUpdate(callback: (data: any) => void): void {
    socketService.on(SOCKET_EVENTS.COURIER_UPDATE, callback);
  }

  onError(callback: (error: any) => void): void {
    socketService.on(SOCKET_EVENTS.ERROR, callback);
  }

  removeListeners(): void {
    socketService.off(SOCKET_EVENTS.COURIER_FOUND);
    socketService.off(SOCKET_EVENTS.LOCATION_UPDATE);
    socketService.off(SOCKET_EVENTS.COURIER_UPDATE);
    socketService.off(SOCKET_EVENTS.ERROR);
  }
}

const customerSocketService = new CustomerSocketService();

export default customerSocketService;
export type {
  CourierFoundData,
  LocationUpdateData, TrackOrderData,
  UntrackData
};

