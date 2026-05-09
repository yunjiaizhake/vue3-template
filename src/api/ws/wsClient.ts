let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let savedUrl = '';
let savedHandlers: WsHandlers | null = null;

type WsHandlers = {
  onMessage: (event: MessageEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
};

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (savedUrl && savedHandlers) {
      console.log('[WS] 尝试重连...');
      createWs(savedUrl, savedHandlers);
    }
  }, 3000);
}

function createWs(url: string, handlers: WsHandlers) {
  ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    console.log('[WS] 已连接');
    handlers.onOpen?.();
  });
  ws.addEventListener('message', handlers.onMessage);
  ws.addEventListener('close', () => {
    handlers.onClose?.();
    scheduleReconnect();
  });
  ws.addEventListener('error', (err) => {
    handlers.onError?.(err);
  });

  return ws;
}

export function initWs(url: string, handlers: WsHandlers) {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return ws;
  }

  savedUrl = url;
  savedHandlers = handlers;
  return createWs(url, handlers);
}

export function getWs() {
  return ws;
}

export function closeWs() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  savedUrl = '';
  savedHandlers = null;
  if (!ws) return;
  ws.close();
  ws = null;
}

export function sendWsMessage(data: unknown) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify(data));
  return true;
}
