import { useAiEventBusStore } from '@/stores/aiEventBus';

let ws: WebSocket | null = null;

function getWsUrl() {
  const baseUrl = import.meta.env.VITE_BASE_API_URL || window.location.origin;
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function initAiChatWs() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return ws;
  }
  const aiBus = useAiEventBusStore();
  ws = new WebSocket(getWsUrl());

  ws.addEventListener('open', () => {
    // console.log('[WS] 已连接');
  });

  ws.addEventListener('message', (event) => {
    let data = event.data;
    try {
      data = JSON.parse(event.data);
    } catch {
      // keep raw text
    }
    console.log('[WS] 收到信号:', data);
    aiBus.emit(data);
  });

  ws.addEventListener('close', () => {
    // console.log('[WS] 已断开');
  });

  ws.addEventListener('error', (err) => {
    console.warn('[WS] 连接错误', err);
  });

  return ws;
}

export function closeAiChatWs() {
  if (!ws) return;
  ws.close();
  ws = null;
}
