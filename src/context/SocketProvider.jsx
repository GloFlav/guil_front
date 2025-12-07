import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as socketService from '@/services/socket';

// Créer le contexte
const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const unsubscribersRef = useRef([]);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        await socketService.connectSocket();
        setConnected(true);
        setError(null);
      } catch (err) {
        console.error('Erreur connexion socket:', err);
        setError(err.message);
        setConnected(false);
      }
    };

    // Enregistrer les listeners
    const unsubConnected = socketService.on('connected', () => {
      setConnected(true);
      setSocketStatus('connected');
      setError(null);
    });

    const unsubDisconnected = socketService.on('disconnected', () => {
      setConnected(false);
      setSocketStatus('disconnected');
    });

    const unsubError = socketService.on('error', (errorData) => {
      setError(errorData.message || 'Erreur inconnue');
    });

    const unsubReconnectFailed = socketService.on('reconnect_failed', () => {
      setError('Impossible de se reconnecter au serveur');
      setSocketStatus('failed');
    });

    unsubscribersRef.current = [
      unsubConnected,
      unsubDisconnected,
      unsubError,
      unsubReconnectFailed,
    ];

    initializeSocket();

    // Cleanup
    return () => {
      unsubscribersRef.current.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const value = {
    connected,
    socketStatus,
    error,
    socket: socketService.getSocket(),
    // Exporter les fonctions du service
    connectSocket: socketService.connectSocket,
    disconnectSocket: socketService.disconnectSocket,
    sendMessage: socketService.sendMessage,
    on: socketService.on,
    off: socketService.off,
    isSocketConnected: socketService.isSocketConnected,
    getSocketStatus: socketService.getSocketStatus,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte socket
 * Usage: const { connected, sendMessage, on } = useSocket();
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket doit être utilisé dans un SocketProvider');
  }
  return context;
};

export default SocketProvider;