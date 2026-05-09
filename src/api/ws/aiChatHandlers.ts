import type { useAiEventBusStore } from '@/stores/aiEventBus';

type AiBus = ReturnType<typeof useAiEventBusStore>;

export function parseWsMessage(event: MessageEvent) {
  let data: unknown = event.data;
  try {
    data = JSON.parse(event.data);
  } catch {
    console.log('[WS] 收到信号:', event);
  }
  return data;
}

// eslint-disable-next-line
export function dispatchAiChatMessage(data: any, aiBus: AiBus) {
  console.log('[WS] 收到信号:', data);
  if (data?.type === 'music_control') {
    aiBus.emit_music_control(data.payload);
  }
  if (data?.type === 'volume_control') {
    aiBus.emit_volume_control(data.payload?.action, data.payload?.value);
  }
  if (data?.type === 'play_song') {
    aiBus.emit_play_song(data.payload?.songName, data.payload?.index);
  }
  if (data?.type === 'queued_song') {
    const raw = data.payload?.artistsOrMoods;
    const incoming: string[] = Array.isArray(raw)
      ? raw
      : typeof raw === 'string' && raw.trim()
        ? [raw.trim()]
        : [];
    aiBus.merge_queued_songs(incoming);
  }
}
