import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getSocketUrl = (): string => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return (
        process.env.NEXT_PUBLIC_SOCKET_URL && !process.env.NEXT_PUBLIC_SOCKET_URL.includes('localhost')
          ? process.env.NEXT_PUBLIC_SOCKET_URL
          : 'https://fsd-miniproject-skab.onrender.com'
      );
    }
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';
};

export const getSocket = (): Socket => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pharmacare_token') || '';
    const url = getSocketUrl();

    if (!socket) {
      socket = io(url, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        auth: {
          token,
        },
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
    } else {
      // If token changed, update socket auth
      if ((socket.auth as any)?.token !== token) {
        socket.auth = { token };
        if (!socket.connected) {
          socket.connect();
        }
      }
    }
  }

  return socket as Socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
