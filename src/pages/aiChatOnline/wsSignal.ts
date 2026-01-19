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
      console.log('[WS] 收到信号:', event);
    }
    console.log('[WS] 收到信号:', data);
    if (data.type === 'music_control') {
      aiBus.emit_music_control(data.payload);
    }
    if (data.type === 'play_song') {
      aiBus.emit_play_song(data.payload.songName, data.payload.index);
    }
  });

  ws.addEventListener('close', () => {
    // console.log('[WS] 已断开');
  });

  ws.addEventListener('error', (err) => {
    console.warn('[WS] 连接错误', err);
  });

  return ws;
}

export function sendAiChatWsMessage(data: unknown) {
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    initAiChatWs();
  }
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(data));
}

export function sendPlayerStatus(type: string, hasSong: boolean) {
  sendAiChatWsMessage({
    type,
    payload: { hasSong },
  });
}

export function closeAiChatWs() {
  if (!ws) return;
  ws.close();
  ws = null;
}
