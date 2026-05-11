'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Clean up URL: remove /api/v1 if present to get the base server URL
    const baseUrl = SOCKET_URL.replace(/\/api\/v1\/?$/, '');
    const isHF = baseUrl.includes('.hf.space');
    
    const socketIo = io(baseUrl, {
      path: '/socket.io',
      // HF Spaces proxy doesn't support sticky sessions well, 
      // so we use 'websocket' ONLY to bypass polling 400 errors.
      transports: isHF ? ['websocket'] : ['websocket', 'polling'],
      secure: baseUrl.startsWith('https'),
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
