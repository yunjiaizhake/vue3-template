export type AiEventPayload = {
  payload?: string;
};

export interface AiEvent {
  payload?: string;
}

export const useAiEventBusStore = defineStore('aiEventBus', {
  state: () => ({
    music_control: null as AiEvent | null,
    play_song: null as AiEvent | null,
  }),
  actions: {
    emit_music_control(payload?: string) {
      this.music_control = {
        payload,
      };
    },
    emit_play_song(payload?: string) {
      this.play_song = {
        payload,
      };
    },
  },
});
