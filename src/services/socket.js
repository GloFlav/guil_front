/**
 * Service de gestion WebSocket pour Survey Generator
 * Connexion native WebSocket avec le backend FastAPI
 */

let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
let reconnectTimeout = null;
let listeners = {};

function getWebSocketUrl() {
  // Priorité: VITE_SOCKET_URL > VITE_API_BASE_URL > localhost
  let baseUrl = import.meta.env.VITE_SOCKET_URL;
  
  if (!baseUrl) {
    baseUrl = import.meta.env.VITE_API_BASE_URL;
  }
  
  if (!baseUrl) {
    console.warn('WebSocket URL non configurée, utilisation de localhost:8000');
    return 'ws://localhost:8000/ws';
  }

  // Convertir http/https en ws/wss
  let wsUrl = baseUrl
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://')
    .replace(/\/$/, ''); // Enlever trailing slash si présent

  // Ajouter /ws si absent
  if (!wsUrl.endsWith('/ws')) {
    wsUrl = wsUrl + '/ws';
  }

  console.log('🔗 WebSocket URL:', wsUrl);
  return wsUrl;
}

export function connectSocket() {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket déjà connecté');
      resolve(ws);
      return;
    }

    try {
      const url = getWebSocketUrl();
      console.log('🔗 Connexion WebSocket à:', url);

      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('✅ WebSocket connecté');
        reconnectAttempts = 0;
        emit('connected', { timestamp: new Date() });
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
          emit('error', {
            type: 'parse_error',
            message: 'Erreur lors du parsing du message',
            error: error.message,
          });
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        emit('error', {
          type: 'websocket_error',
          message: 'Erreur de connexion WebSocket',
          error: error,
        });
        reject(error);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket déconnecté');
        emit('disconnected', { timestamp: new Date() });
        attemptReconnect();
      };
    } catch (error) {
      console.error('Erreur création WebSocket:', error);
      reject(error);
    }
  });
}

function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('❌ Nombre max de tentatives de reconnexion atteint');
    emit('reconnect_failed', {
      attempts: reconnectAttempts,
      maxAttempts: MAX_RECONNECT_ATTEMPTS,
    });
    return;
  }

  reconnectAttempts++;
  console.log(
    `🔄 Tentative de reconnexion ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} dans ${RECONNECT_DELAY}ms`
  );

  reconnectTimeout = setTimeout(() => {
    connectSocket().catch((error) => {
      console.error('Erreur lors de la reconnexion:', error);
    });
  }, RECONNECT_DELAY);
}

export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket non connecté'));
      return;
    }

    try {
      ws.send(JSON.stringify(message));
      console.log('📤 Message envoyé:', message.type);
      resolve();
    } catch (error) {
      console.error('Erreur envoi message:', error);
      reject(error);
    }
  });
}

function handleMessage(message) {
  const { type, status, message: msg, percentage, data, error } = message;

  console.log(`📥 Message reçu [${type}/${status}]:`, message);

  // Émettre différents événements selon le type
  if (type === 'progress') {
    emit('progress', {
      status,
      message: msg,
      percentage,
      data,
    });
  } else if (type === 'error') {
    emit('error', {
      type: error || 'unknown_error',
      message: msg,
    });
  } else if (type === 'result') {
    emit('result', data);
  }

  // Émettre le message générique
  emit('message', message);
}

export function on(event, callback) {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(callback);

  // Retourner fonction de désabonnement
  return () => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((cb) => cb !== callback);
    }
  };
}

export function off(event, callback) {
  if (listeners[event]) {
    listeners[event] = listeners[event].filter((cb) => cb !== callback);
  }
}

function emit(event, data) {
  if (listeners[event]) {
    listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erreur listener ${event}:`, error);
      }
    });
  }
}

export function disconnectSocket() {
  console.log('🔌 Déconnexion WebSocket');

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  listeners = {};
}

export function getSocketStatus() {
  if (!ws) return 'disconnected';
  
  switch (ws.readyState) {
    case WebSocket.CONNECTING:
      return 'connecting';
    case WebSocket.OPEN:
      return 'connected';
    case WebSocket.CLOSING:
      return 'closing';
    case WebSocket.CLOSED:
      return 'disconnected';
    default:
      return 'unknown';
  }
}

export function isSocketConnected() {
  return ws && ws.readyState === WebSocket.OPEN;
}

/**
 * Retourne l'instance WebSocket actuelle
 */
export function getSocket() {
  return ws;
}

export default {
  connectSocket,
  sendMessage,
  disconnectSocket,
  on,
  off,
  isSocketConnected,
  getSocketStatus,
  getSocket,
};