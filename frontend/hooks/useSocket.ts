import { useEffect, useState } from 'react';
import socketService from '../services/socket/socket';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async () => {
    if (isConnected || isConnecting) return;
    
    try {
      setIsConnecting(true);
      await socketService.connect();
      setIsConnected(true);
    } catch (error) {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    socketService.disconnect();
    setIsConnected(false);
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    emit: socketService.emit.bind(socketService),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
  };
};