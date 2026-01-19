export type MusicControl = {
  payload?: string;
};

export interface PlaySong {
  payload?: string;
  index?: number;
}

export const useAiEventBusStore = defineStore('aiEventBus', {
  state: () => ({
    music_control: null as MusicControl | null,
    play_song: null as PlaySong | null,
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
  },
});
