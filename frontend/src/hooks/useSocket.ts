import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (buildId: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('joinBuildLogs', buildId);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [buildId]);

  return socketRef.current;
};
