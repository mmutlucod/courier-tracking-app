
import { SOCKET_EVENTS } from '../../utils/constants';
import socketService from './socket';

interface CourierLocationData {
  courierId: string;
  lat: number;
  lng: number;
  speed: number;
  accuracy?: number;
  heading?: number;
  timestamp?: number;
}

interface CourierStatusData {
  courierId: string;
  orderId?: string;
}

class CourierSocketService {
  sendLocation(data: CourierLocationData): void {
    socketService.emit(SOCKET_EVENTS.COURIER_LOCATION, data);
  }

  startDelivery(data: CourierStatusData): void {
    socketService.emit(SOCKET_EVENTS.COURIER_START, data);
  }

  stopDelivery(data: CourierStatusData): void {
    socketService.emit(SOCKET_EVENTS.COURIER_STOP, data);
  }

  onCourierUpdate(callback: (data: any) => void): void {
    socketService.on(SOCKET_EVENTS.COURIER_UPDATE, callback);
  }

  onCourierStatus(callback: (data: any) => void): void {
    socketService.on(SOCKET_EVENTS.COURIER_STATUS, callback);
  }

  onError(callback: (error: any) => void): void {
    socketService.on(SOCKET_EVENTS.ERROR, callback);
  }

  removeListeners(): void {
    socketService.off(SOCKET_EVENTS.COURIER_UPDATE);
    socketService.off(SOCKET_EVENTS.COURIER_STATUS);
    socketService.off(SOCKET_EVENTS.ERROR);
  }
}

const courierSocketService = new CourierSocketService();

export default courierSocketService;
export type { CourierLocationData, CourierStatusData };

