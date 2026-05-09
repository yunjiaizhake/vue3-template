// 播放器，控制暂停/播放/上一首/下一首
export type MusicControl = {
  payload?: string;
};

// 改变音量，action为增大还是减小音量
export type VolumeControlPayload = {
  action?: string;
  value?: number;
};

// 大模板通过具体歌曲名字播放歌曲，并可以推荐10首然后播放其中的某一首
export interface PlaySong {
  payload?: string;
  index?: number;
}

export const useAiEventBusStore = defineStore('aiEventBus', {
  state: () => ({
    music_control: null as MusicControl | null,
    play_song: null as PlaySong | null,
    volume_control: null as VolumeControlPayload | null,
    // queue_song MCP工具检测到的歌手/情绪关键词队列，用Set去重，按插入顺序消费
    queued_songs: [] as string[],
  }),
  actions: {
    emit_music_control(payload?: string) {
      this.music_control = { payload };
    },
    emit_play_song(payload: string, index: number) {
      this.play_song = { payload, index };
    },
    emit_volume_control(action?: string, value?: number) {
      this.volume_control = { action, value };
    },
    add_queued_song(artistOrMood: string) {
      if (!artistOrMood || this.queued_songs.includes(artistOrMood)) return;
      this.queued_songs.push(artistOrMood);
    },
    merge_queued_songs(incoming: string[]) {
      const merged = [...new Set([...this.queued_songs, ...incoming.filter(Boolean)])];
      this.queued_songs = merged;
    },
    pop_queued_song(): string | undefined {
      return this.queued_songs.shift();
    },
  },
});
