import { useEffect, useRef } from 'react';

// Mock socket for development - in production, you would use actual Socket.IO
let mockSocket: any = null;

export function useSocket() {
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!mockSocket) {
      // Create a mock socket object for development
      mockSocket = {
        on: (event: string, callback: Function) => {
          console.log(`Mock socket: listening for ${event}`);
          // In a real implementation, this would set up actual event listeners
        },
        off: (event: string, callback?: Function) => {
          console.log(`Mock socket: removing listener for ${event}`);
          // In a real implementation, this would remove event listeners
        },
        emit: (event: string, data?: any) => {
          console.log(`Mock socket: emitting ${event}`, data);
          // In a real implementation, this would emit events to the server
        },
        connected: false,
        disconnected: true
      };
    }
    socketRef.current = mockSocket;

    return () => {
      // Cleanup if needed
    };
  }, []);

  return socketRef.current;
}
