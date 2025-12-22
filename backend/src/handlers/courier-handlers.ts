import type { Server, Socket } from 'socket.io';
import Location from '../models/location';
import Order from '../models/order';
import { LocationService } from '../services/location-service';
import type { CourierLocation } from '../types';

function courierHandlers(socket: Socket, io: Server) {
  const locationService = new LocationService();

  socket.on('courier:location', async (data: CourierLocation) => {
    try {
      const { courierId, lat, lng, speed, timestamp } = data;
      console.log(`📍 Courier ${courierId} location: (${lat}, ${lng}) - ${speed} m/s`);

      if (!courierId || lat === undefined || lng === undefined) {
        socket.emit('error', { message: 'Invalid location data', code: 'INVALID_DATA' });
        return;
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        socket.emit('error', { message: 'Invalid coordinates', code: 'INVALID_COORDINATES' });
        return;
      }

      await locationService.updateCourierLocation(data);

      const activeOrder = await Order.findOne({ courierId, status: { $in: ['assigned', 'picked_up', 'in_transit'] } });

      if (activeOrder) {
        await Location.create({
          courierId, orderId: activeOrder._id,
          location: { type: 'Point', coordinates: [lng, lat] },
          speed: speed || 0, timestamp: new Date(timestamp || Date.now()),
        });
      }

      io.emit('courier:update', { courierId, lat, lng, speed: speed || 0, timestamp: timestamp || Date.now() });
      io.to(`courier:${courierId}`).emit('courier:location:update', { courierId, lat, lng, speed: speed || 0, timestamp: timestamp || Date.now() });

    } catch (error) {
      console.error('❌ Courier location error:', error);
      socket.emit('error', { message: 'Location update failed', code: 'UPDATE_FAILED' });
    }
  });

  socket.on('courier:start', async (data: { courierId: string; orderId?: string }) => {
    try {
      const { courierId, orderId } = data;
      console.log(`🚴 Courier ${courierId} started delivery`);

      await locationService.updateCourierStatus(courierId, 'active');

      if (orderId) await Order.findByIdAndUpdate(orderId, { status: 'in_transit' });

      io.emit('courier:status', { courierId, status: 'active', timestamp: Date.now() });
    } catch (error) {
      console.error('❌ Courier start error:', error);
    }
  });

  socket.on('courier:stop', async (data: { courierId: string }) => {
    try {
      const { courierId } = data;
      console.log(`🛑 Courier ${courierId} stopped delivery`);

      await locationService.updateCourierStatus(courierId, 'idle');

      io.emit('courier:status', { courierId, status: 'idle', timestamp: Date.now() });
    } catch (error) {
      console.error('❌ Courier stop error:', error);
    }
  });

  socket.on('disconnect', async () => { console.log(`🔌 Courier disconnected: ${socket.id}`); });
}

export default courierHandlers;