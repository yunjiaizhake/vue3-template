<template>
  <div class="music-card" :class="{ 'is-playing': isCurrentAndPlaying }">
    <div class="music-card-cover">
      <img v-if="coverUrl" :src="coverUrl" alt="" />
      <div v-else class="cover-placeholder">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path
            d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6ZM10 19a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
          />
        </svg>
      </div>
    </div>
    <div class="music-card-info">
      <span class="song-name">{{ name }}</span>
      <span class="song-artist">{{ artist }}</span>
    </div>
    <button class="music-card-play" :disabled="loading" @click="handleToggle">
      <!-- 加载中 -->
      <svg
        v-if="loading"
        class="spin"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      <!-- 暂停图标 -->
      <svg
        v-else-if="isCurrentAndPlaying"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
      >
        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
      </svg>
      <!-- 播放图标 -->
      <svg
        v-else
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { searchAndPlay, searchSongs, fetchSongImage } from '@/utils/aiplay';
import { usePlayerStore } from '@/stores';
import { storeToRefs } from 'pinia';

defineOptions({ name: 'MusicCard' });

const props = defineProps<{
  name: string;
  artist: string;
}>();

const playerStore = usePlayerStore();
const { playing, currentMusic } = storeToRefs(playerStore);

const loading = ref(false);
const matchedId = ref('');
const coverUrl = ref('');

const isCurrentAndPlaying = computed(() => {
  if (!matchedId.value) return false;
  return currentMusic.value.id === matchedId.value && playing.value;
});

const isCurrentSong = computed(() => {
  if (!matchedId.value) return false;
  return currentMusic.value.id === matchedId.value;
});

async function tryFetchCover() {
  try {
    const songs = await searchSongs(`${props.name} ${props.artist}`);
    if (songs.length > 0) {
      matchedId.value = songs[0]!.id;
      if (songs[0]!.image) {
        coverUrl.value = songs[0]!.image;
      } else {
        coverUrl.value = await fetchSongImage(songs[0]!.id);
      }
    }
  } catch {
    // 封面获取失败不影响功能
  }
}

async function handleToggle() {
  if (loading.value) return;

  if (isCurrentAndPlaying.value) {
    playerStore.setPlaying(false);
    return;
  }

  if (isCurrentSong.value && !playing.value) {
    playerStore.setPlaying(true);
    return;
  }

  loading.value = true;
  try {
    const result = await searchAndPlay(`${props.name} ${props.artist}`);
    if (result) {
      matchedId.value = result.id;
      if (result.image) coverUrl.value = result.image;
    }
  } catch (e) {
    console.error('[MusicCard] 播放失败:', e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  tryFetchCover();
});
</script>

<style lang="less" scoped>
.music-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin: 6px 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.3s;
  max-width: 320px;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &.is-playing {
    border-color: rgba(64, 206, 143, 0.5);
    background: rgba(64, 206, 143, 0.1);
  }
}

.music-card-cover {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.06);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.3);
  }
}

.music-card-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;

  .song-name {
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .song-artist {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }
}

.music-card-play {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s;

  &:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 2px 10px rgba(102, 126, 234, 0.5);
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}
</style>
