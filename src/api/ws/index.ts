import { useAiEventBusStore } from '@/stores/aiEventBus';
import { getWsUrl } from '@/api/ws/wsUrl';
import { initWs, getWs, sendWsMessage, closeWs } from '@/api/ws/wsClient';
import { parseWsMessage, dispatchAiChatMessage } from '@/api/ws/aiChatHandlers';
import { buildPlayerStatusMessage } from '@/api/ws/aiChatSender';

export function initAiChatWs() {
  const aiBus = useAiEventBusStore();
  return initWs(getWsUrl(), {
    onMessage: (event) => {
      const data = parseWsMessage(event);
      dispatchAiChatMessage(data, aiBus);
    },
    onOpen: () => {
      // console.log('[WS] 已连接');
    },
    onClose: () => {
      // console.log('[WS] 已断开');
    },
    onError: (err) => {
      console.warn('[WS] 连接错误', err);
    },
  });
}

export function sendAiChatWsMessage(data: unknown) {
  const ws = getWs();
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    initAiChatWs();
  }
  if (!sendWsMessage(data)) return;
}

// 向服务端发送音乐控制器已启用信号，可以启用上一曲下一曲功能
export function sendPlayerStatus(type: string, hasSong: boolean) {
  sendAiChatWsMessage(buildPlayerStatusMessage(type, hasSong));
}

export function closeAiChatWs() {
  closeWs();
}
