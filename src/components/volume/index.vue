<template>
  <div class="volume">
    <mm-icon
      class="pointer volume-icon"
      :type="getVolumeIconType()"
      :size="30"
      @click="handleToggleVolume"
    />

    <div class="volume-progress-wrapper">
      <mm-progress
        :percent="props.volume"
        @percentChange="handleVolumeChange"
        @percentChangeEnd="handleVolumeChange"
      />
    </div>
  </div>
</template>

<script setup>
import MmProgress from '@/base/mm-progress/index.vue';

// -------- props --------
const props = defineProps({
  volume: {
    type: Number,
    required: true,
  },
});

// -------- emit --------
const emit = defineEmits(['volumeChange']);

// -------- 内部状态 --------
const lastVolume = ref(props.volume);

// 是否静音
const isMute = computed({
  get() {
    return props.volume === 0;
  },
  set(mute) {
    const volume = mute ? 0 : lastVolume.value;
    if (mute) lastVolume.value = props.volume;
    handleVolumeChange(volume);
  },
});

// -------- methods --------
function getVolumeIconType() {
  return isMute.value ? 'volume-off' : 'volume';
}

function handleToggleVolume() {
  isMute.value = !isMute.value;
}

function handleVolumeChange(percent) {
  emit('volumeChange', percent);
}
</script>

<style scoped lang="less">
.volume {
  display: flex;
  align-items: center;
  width: 150px;

  &-icon {
    margin-right: 5px;
    color: #fff;
  }

  &-progress-wrapper {
    flex: 1;
  }

  @media (max-width: 768px) {
    top: 2px;
    width: 36px;
  }
}
</style>

<style lang="less" scoped>
.volume {
  display: flex;
  align-items: center;
  width: 150px;
  &-icon {
    margin-right: 5px;
    color: #fff;
  }
  &-progress-wrapper {
    flex: 1;
  }
  @media (max-width: 768px) {
    top: 2px;
    width: 36px;
  }
}
</style>
