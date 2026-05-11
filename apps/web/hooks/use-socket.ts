'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const isHF = SOCKET_URL.includes('.hf.space');
    
    const socketIo = io(SOCKET_URL, {
      path: '/socket.io',
      // HF Spaces proxy can be problematic with WebSockets
      transports: isHF ? ['polling', 'websocket'] : ['websocket', 'polling'],
      secure: SOCKET_URL.startsWith('https'),
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketIo.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  return socket;
}
