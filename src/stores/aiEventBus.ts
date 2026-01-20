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
  }),
  actions: {
    emit_music_control(payload?: string) {
      this.music_control = {
        payload,
      };
    },
    emit_play_song(payload: string, index: number) {
      this.play_song = {
        payload,
        index,
      };
    },
    emit_volume_control(action?: string, value?: number) {
      this.volume_control = {
        action,
        value,
      };
    },
  },
});
