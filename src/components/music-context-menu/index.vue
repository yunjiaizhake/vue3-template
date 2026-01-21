<template>
  <teleport to="body">
    <transition name="context-menu">
      <div
        v-if="visible"
        :key="menuKey"
        class="music-context-menu"
        :style="menuStyle"
        @contextmenu.prevent
      >
        <div ref="menuRef" class="menu-panel" @click.stop>
          <button
            v-for="item in items"
            :key="item.key"
            class="menu-item"
            :class="{ disabled: item.disabled }"
            :disabled="item.disabled"
            type="button"
            @click="handleSelect(item)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { useContextMenu, type ContextMenuItem } from '@/hooks/useContextMenu';

const props = defineProps({
  items: { type: Array as PropType<ContextMenuItem[]>, default: () => [] },
});

const emit = defineEmits(['select']);

const menuRef = ref<HTMLDivElement | null>(null);
const menuStyle = ref({
  left: '0px',
  top: '0px',
});
const { visible, position, open, close, menuKey } = useContextMenu();

function updatePosition() {
  const menuWidth = menuRef.value?.offsetWidth ?? 0;
  const menuHeight = menuRef.value?.offsetHeight ?? 0;
  const padding = 8;
  const maxLeft = Math.max(padding, window.innerWidth - menuWidth - padding);
  const maxTop = Math.max(padding, window.innerHeight - menuHeight - padding);

  const left = Math.max(padding, Math.min(position.x, maxLeft));
  const top = Math.max(padding, Math.min(position.y, maxTop));

  menuStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
  };
}

watch(
  () => [visible.value, position.x, position.y],
  async ([isVisible]) => {
    if (!isVisible) return;
    await nextTick();
    updatePosition();
  },
);

function handleSelect(item: ContextMenuItem) {
  if (item.disabled) return;
  emit('select', item.key);
  close();
}

defineExpose({
  open,
  close,
  visible,
  position,
  menuKey,
});
</script>

<style lang="less" scoped>
.music-context-menu {
  position: fixed;
  z-index: 9999;
}

.context-menu-enter-active,
.context-menu-leave-active {
  transition: all 0.2s;
  transform-origin: top left;
}

.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.9);
}

.context-menu-enter-to,
.context-menu-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.menu-panel {
  min-width: 140px;
  padding: 6px 0;
  border-radius: 6px;
  background: rgba(30, 30, 30, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.35),
    0 2px 6px rgba(0, 0, 0, 0.2);
}

.menu-item {
  width: 100%;
  padding: 8px 14px;
  color: #fff;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  &.disabled {
    color: rgba(255, 255, 255, 0.35);
    cursor: not-allowed;
  }
}
</style>
