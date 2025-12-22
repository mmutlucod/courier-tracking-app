
import { io, Socket } from 'socket.io-client';
import { API_CONFIG, SOCKET_EVENTS } from '../../utils/constants';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to:', API_CONFIG.SOCKET_URL);

        this.socket = io(API_CONFIG.SOCKET_URL, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
          timeout: 10000,
        });
        this.socket.on(SOCKET_EVENTS.CONNECT, () => {
          console.log('✅ Socket connected!');
          console.log('✅ Socket ID:', this.socket?.id);
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
          console.error('❌ Connection error:', error.message);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Socket bağlantısı kurulamadı'));
          }
        });

        this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
          console.log('🔌 Socket disconnected:', reason);
        });
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log('🔄 Reconnect attempt:', attemptNumber);
        });
        this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
          console.error('❌ Socket error:', error);
        });

      } catch (error) {
        console.error('❌ Socket setup error:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('👋 Socket disconnected');
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      console.log(`📤 Emit: ${event}`, data);
    } else {
      console.warn('⚠️ Socket not connected');
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }


  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

const socketService = new SocketService();

export default socketService;
