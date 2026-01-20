export function buildPlayerStatusMessage(type: string, hasSong: boolean) {
  return {
    type,
    payload: { hasSong },
  };
}
