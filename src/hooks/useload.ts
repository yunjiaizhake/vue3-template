export function useLoad(delay = 200) {
  const bbLoadShow = ref(true);
  let timer: number | null = null;

  function _hideLoad() {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      bbLoadShow.value = false;
    }, delay);
  }

  return {
    bbLoadShow,
    _hideLoad,
  };
}
