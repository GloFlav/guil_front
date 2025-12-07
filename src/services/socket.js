/**
 * Service de gestion WebSocket pour Survey Generator
 */

let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
let reconnectTimeout = null;
let listeners = {};

function getWebSocketUrl() {
  let baseUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || 'ws://localhost:8000';
  let wsUrl = baseUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://').replace(/\/$/, '');
  if (!wsUrl.endsWith('/ws')) wsUrl = wsUrl + '/ws';
  return wsUrl;
}

export function connectSocket() {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      resolve(ws);
      return;
    }

    try {
      ws = new WebSocket(getWebSocketUrl());

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
          console.error('Erreur parsing:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        emit('error', { type: 'websocket_error', message: 'Erreur connexion', error });
        reject(error);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket déconnecté');
        emit('disconnected', { timestamp: new Date() });
        attemptReconnect();
      };
    } catch (error) {
      reject(error);
    }
  });
}

function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    emit('reconnect_failed', {});
    return;
  }
  reconnectAttempts++;
  reconnectTimeout = setTimeout(() => connectSocket().catch(e => {}), RECONNECT_DELAY);
}

export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket non connecté'));
      return;
    }
    ws.send(JSON.stringify(message));
    resolve();
  });
}

function handleMessage(message) {
  const { type, status, message: msg, percentage, data, error, level } = message;

  if (type === 'progress') {
    emit('progress', { status, message: msg, percentage, data });
  } else if (type === 'error') {
    emit('error', { type: error, message: msg });
  } else if (type === 'result') {
    emit('result', data);
  } else if (type === 'log') {
    emit('log', {
      level: level,
      text: msg,
      timestamp: message.timestamp
    });
  }
}

export function on(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
  return () => {
    listeners[event] = listeners[event].filter((cb) => cb !== callback);
  };
}

export function off(event, callback) {
  if (listeners[event]) listeners[event] = listeners[event].filter((cb) => cb !== callback);
}

function emit(event, data) {
  if (listeners[event]) {
    listeners[event].forEach((callback) => callback(data));
  }
}

export function disconnectSocket() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  if (ws) {
    ws.close();
    ws = null;
  }
  listeners = {};
}

// --- FONCTIONS MANQUANTES AJOUTÉES ICI ---

export function getSocket() {
  return ws;
}

export function isSocketConnected() {
  return ws && ws.readyState === WebSocket.OPEN;
}

// Export par défaut mis à jour
export default { 
  connectSocket, 
  sendMessage, 
  disconnectSocket, 
  on, 
  off, 
  getSocket,       // <--- AJOUT CRUCIAL
  isSocketConnected // <--- AJOUT CRUCIAL
};