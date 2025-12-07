import React, { createContext, useContext, useEffect, useState } from 'react';
import * as socketService from '../services/socket';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket doit être utilisé au sein d\'un SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState(null);

  useEffect(() => {
    // Initialisation connexion
    const initSocket = async () => {
      try {
        await socketService.connectSocket();
      } catch (err) {
        console.error("Erreur init socket:", err);
      }
    };

    initSocket();

    // Listeners pour l'état global
    const unsubConnected = socketService.on('connected', () => setIsConnected(true));
    const unsubDisconnected = socketService.on('disconnected', () => setIsConnected(false));
    const unsubError = socketService.on('error', (err) => setLastError(err));

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubError();
      socketService.disconnectSocket();
    };
  }, []);

  const value = {
    socketService, // Expose tout le service
    isConnected,
    lastError,
    // Wrapper safe pour getSocket
    getSocket: () => socketService.getSocket(),
    sendMessage: socketService.sendMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;