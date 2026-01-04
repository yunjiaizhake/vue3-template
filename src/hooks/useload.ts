export function useLoad(delay = 200) {
  const mmLoadShow = ref(true);
  let timer: number | null = null;

  function _hideLoad() {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      mmLoadShow.value = false;
    }, delay);
  }

  return {
    mmLoadShow,
    _hideLoad,
  };
}
