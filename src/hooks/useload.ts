export function useLoad(delay = 200, timeout = 10000) {
  const bbLoadShow = ref(true);
  let timer: number | null = null;
  let timeoutTimer: number | null = null;

  // 清除所有定时器
  function _clearTimers() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  }

  // 隐藏 loading
  function _hideLoad() {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      bbLoadShow.value = false;
    }, delay);
  }

  // 开启超时自动关闭
  function _startTimeout() {
    _clearTimers();
    timeoutTimer = window.setTimeout(() => {
      if (bbLoadShow.value) {
        bbLoadShow.value = false;
      }
    }, timeout);
  }

  // 监听 loading 状态，显示时开启超时计时
  watch(
    bbLoadShow,
    (newVal) => {
      if (newVal) {
        _startTimeout();
      } else {
        _clearTimers();
      }
    },
    { immediate: true },
  );

  return {
    bbLoadShow,
    _hideLoad,
  };
}
