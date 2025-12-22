import type { Server } from 'socket.io';
import courierHandlers from '../handlers/courier-handlers';
import customerHandlers from '../handlers/customer-handlers';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    console.log(`📊 Total clients: ${io.engine.clientsCount}`);

    courierHandlers(socket, io);
    customerHandlers(socket, io);

    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error(' Socket error:', error);
    });
  });

  io.engine.on('connection_error', (err) => {
    console.error(' Connection error:', err);
  });

  console.log('✅ Socket.io handlers configured');
}