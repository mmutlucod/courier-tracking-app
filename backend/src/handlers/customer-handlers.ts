import type { Server, Socket } from 'socket.io';
import Order from '../models/order';
import { ETAService } from '../services/eta-service';
import { LocationService } from '../services/location-service';
import type { CourierFoundResponse, CustomerTrackRequest, ErrorResponse } from '../types';

function customerHandlers(socket: Socket, io: Server) {
  const locationService = new LocationService();
  const etaService = new ETAService();

  socket.on('customer:track', async (data: CustomerTrackRequest) => {
    try {
      const { orderId } = data;
      console.log(`👤 Customer tracking order: ${orderId}`);

      if (!orderId) {
        socket.emit('error', { message: 'Sipariş numarası gerekli', code: 'ORDER_ID_REQUIRED' } as ErrorResponse);
        return;
      }

      const order = await Order.findOne({ $or: [{ orderNumber: orderId }, { _id: orderId }] }).populate('courierId', 'name phone vehicleType');

      if (!order) {
        socket.emit('error', { message: 'Sipariş bulunamadı', code: 'ORDER_NOT_FOUND' } as ErrorResponse);
        return;
      }

      if (!order.courierId) {
        socket.emit('error', { message: 'Sipariş henüz kuryeye atanmadı', code: 'NO_COURIER_ASSIGNED' } as ErrorResponse);
        return;
      }

      const courierId = order.courierId._id.toString();
      const location = await locationService.getCourierLocation(courierId);

      if (!location || !location.lat || !location.lng) {
        socket.emit('error', { message: 'Kurye henüz aktif değil', code: 'COURIER_OFFLINE' } as ErrorResponse);
        return;
      }

      socket.join(`courier:${courierId}`);
      console.log(`👤 Customer joined room: courier:${courierId}`);

      const eta = etaService.calculateETA(location.lat, location.lng, order.deliveryLat, order.deliveryLng, location.speed);

      const response: CourierFoundResponse = {
        courierId,
        location: { latitude: location.lat, longitude: location.lng },
        speed: location.speed,
        eta: eta.minutes,
        distance: eta.distance.toFixed(2),
      };

      socket.emit('courier:found', response);
      console.log(`✅ Courier found and sent to customer`);
      console.log(`📍 Distance: ${eta.distance} km, ETA: ${eta.minutes} min`);
    } catch (error) {
      console.error('❌ Customer track error:', error);
      socket.emit('error', { message: 'Takip başlatılamadı', code: 'TRACK_FAILED' } as ErrorResponse);
    }
  });

  socket.on('customer:untrack', (data: { courierId?: string }) => {
    try {
      const { courierId } = data;
      if (courierId) {
        socket.leave(`courier:${courierId}`);
        console.log(`👤 Customer left room: courier:${courierId}`);
      }
    } catch (error) {
      console.error('❌ Customer untrack error:', error);
    }
  });

  socket.on('disconnect', () => { console.log(`🔌 Customer disconnected: ${socket.id}`); });
}

export default customerHandlers;