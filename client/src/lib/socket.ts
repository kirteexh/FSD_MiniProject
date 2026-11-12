import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket && typeof window !== 'undefined') {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to PharmaCare live server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from live server');
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connection error (retrying):', error.message);
    });
  }

  return socket as Socket;
};

