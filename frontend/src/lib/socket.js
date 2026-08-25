import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance && typeof window !== 'undefined') {
    socketInstance = io(WS_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket.IO connected:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('Socket.IO connection error:', err.message);
    });
  }
  return socketInstance;
};

export const useSocket = (workspaceId, projectId) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    if (workspaceId) {
      socket.emit('join:workspace', workspaceId);
    }
    if (projectId) {
      socket.emit('join:project', projectId);
    }

    return () => {
      if (workspaceId) {
        socket.emit('leave:workspace', workspaceId);
      }
      if (projectId) {
        socket.emit('leave:project', projectId);
      }
    };
  }, [workspaceId, projectId]);

  return socketRef.current;
};
