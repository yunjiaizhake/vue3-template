export interface ContextMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export function useContextMenu() {
  const visible = ref(false);
  const menuKey = ref(0);
  const position = reactive({
    x: 0,
    y: 0,
  });
  const hide = () => {
    if (visible.value) visible.value = false;
  };

  function open(event: MouseEvent) {
    event.preventDefault();
    position.x = event.clientX;
    position.y = event.clientY;
    if (visible.value) {
      menuKey.value += 1;
    } else {
      visible.value = true;
    }
  }

  function close() {
    visible.value = false;
  }

  onMounted(() => {
    window.addEventListener('click', hide);
    window.addEventListener('resize', hide);
    window.addEventListener('scroll', hide, true);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('click', hide);
    window.removeEventListener('resize', hide);
    window.removeEventListener('scroll', hide, true);
  });

  return {
    visible,
    menuKey,
    position,
    open,
    close,
  };
}
