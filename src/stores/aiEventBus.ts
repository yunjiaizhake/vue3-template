export type AiEventPayload = {
  payload?: string;
};

export interface AiEvent {
  payload?: string;
}

export const useAiEventBusStore = defineStore('aiEventBus', {
  state: () => ({
    lastEvent: null as AiEvent | null,
  }),
  actions: {
    emit(payload?: string) {
      this.lastEvent = {
        payload,
      };
    },
    clear() {
      this.lastEvent = null;
    },
  },
});
