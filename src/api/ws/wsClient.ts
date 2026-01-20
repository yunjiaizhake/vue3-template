let ws: WebSocket | null = null;

type WsHandlers = {
  onMessage: (event: MessageEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
};

export function initWs(url: string, handlers: WsHandlers) {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return ws;
  }

  ws = new WebSocket(url);
  ws.addEventListener('open', () => handlers.onOpen?.());
  ws.addEventListener('message', handlers.onMessage);
  ws.addEventListener('close', () => handlers.onClose?.());
  ws.addEventListener('error', (err) => handlers.onError?.(err));
  return ws;
}

export function getWs() {
  return ws;
}

export function closeWs() {
  if (!ws) return;
  ws.close();
  ws = null;
}

export function sendWsMessage(data: unknown) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify(data));
  return true;
}
