import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '../lib/config';

export const useSocket = (buildId: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(config.socketUrl);
    socketRef.current.emit('joinBuildLogs', buildId);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [buildId]);

  return socketRef.current;
};
