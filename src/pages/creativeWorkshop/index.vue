<template>
  <div class="creative-workshop">
    <!-- 头部 -->
    <div class="workshop-header">
      <div class="header-info">
        <span class="header-title">创意工坊</span>
        <span class="header-desc">用 AI 创作属于你的音乐</span>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="workshop-body">
      <!-- 左侧：表单区域 -->
      <div class="form-area">
        <!-- 必填项 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-dot required"></span>
            基本信息
          </div>

          <!-- 创作模式 -->
          <div class="form-item">
            <label class="form-label">
              创作模式
              <span class="required-star">*</span>
            </label>
            <div class="mode-tabs">
              <span
                class="mode-tab"
                :class="{ active: formData.customMode }"
                @click="formData.customMode = true"
              >
                自定义模式
              </span>
              <span
                class="mode-tab"
                :class="{ active: !formData.customMode }"
                @click="formData.customMode = false"
              >
                描述模式
              </span>
            </div>
            <p class="form-hint">
              {{
                formData.customMode
                  ? '需要指定标题、风格，可精确控制歌词内容'
                  : '只需描述想要的音乐，AI 自动生成歌词'
              }}
            </p>
          </div>

          <!-- 模型版本 -->
          <div class="form-item">
            <label class="form-label">
              模型版本
              <span class="required-star">*</span>
            </label>
            <div class="radio-group">
              <span
                v-for="opt in modelOptions"
                :key="opt.value"
                class="radio-item"
                :class="{ active: formData.model === opt.value }"
                @click="formData.model = opt.value"
              >
                {{ opt.label }}
              </span>
            </div>
          </div>

          <!-- 纯音乐模式 -->
          <div class="form-item row">
            <label class="form-label">
              纯音乐模式
              <span class="required-star">*</span>
            </label>
            <div
              class="toggle-switch"
              :class="{ on: formData.instrumental }"
              @click="formData.instrumental = !formData.instrumental"
            >
              <span class="toggle-thumb"></span>
            </div>
            <span class="toggle-label">
              {{ formData.instrumental ? '纯音乐（无人声）' : '包含人声' }}
            </span>
          </div>

          <!-- 歌曲标题（自定义模式必填） -->
          <div v-if="formData.customMode" class="form-item">
            <label class="form-label">
              歌曲标题
              <span class="required-star">*</span>
            </label>
            <input
              v-model.trim="formData.title"
              type="text"
              class="form-input"
              placeholder="为你的作品起个名字"
              :maxlength="titleMaxLength"
            />
            <span class="char-count"
              >{{ formData.title.length }}/{{ titleMaxLength }}</span
            >
          </div>

          <!-- 音乐风格（自定义模式必填） -->
          <div v-if="formData.customMode" class="form-item">
            <label class="form-label">
              音乐风格
              <span class="required-star">*</span>
            </label>
            <div class="style-tags">
              <span
                v-for="tag in styleOptions"
                :key="tag"
                class="style-tag"
                :class="{ active: formData.style === tag }"
                @click="formData.style = tag"
              >
                {{ tag }}
              </span>
            </div>
            <input
              v-model.trim="formData.style"
              type="text"
              class="form-input style-input"
              placeholder="或者自定义风格..."
            />
          </div>

          <!-- 创作描述 / 歌词 -->
          <div v-if="needsPrompt" class="form-item">
            <label class="form-label">
              {{ formData.customMode ? '歌词' : '创作描述' }}
              <span class="required-star">*</span>
            </label>
            <textarea
              v-model.trim="formData.prompt"
              class="form-textarea"
              :placeholder="promptPlaceholder"
              :maxlength="promptMaxLength"
              rows="5"
            ></textarea>
            <span class="char-count"
              >{{ formData.prompt.length }}/{{ promptMaxLength }}</span
            >
          </div>
        </div>

        <!-- 可选项 -->
        <div class="form-section">
          <div class="section-title clickable" @click="showAdvanced = !showAdvanced">
            <span class="title-dot optional"></span>
            高级选项
            <span class="toggle-arrow" :class="{ expanded: showAdvanced }"> ▶ </span>
          </div>

          <transition name="slide">
            <div v-show="showAdvanced" class="advanced-options">
              <div v-if="!formData.instrumental" class="form-item">
                <label class="form-label">声线性别</label>
                <div class="radio-group">
                  <span
                    class="radio-item"
                    :class="{ active: formData.vocalGender === 'f' }"
                    @click="formData.vocalGender = 'f'"
                  >
                    女声
                  </span>
                  <span
                    class="radio-item"
                    :class="{ active: formData.vocalGender === 'm' }"
                    @click="formData.vocalGender = 'm'"
                  >
                    男声
                  </span>
                </div>
              </div>

              <div class="form-item">
                <label class="form-label">排除标签</label>
                <input
                  v-model.trim="formData.negativeTags"
                  type="text"
                  class="form-input"
                  placeholder="不想出现的元素，用逗号分隔（如：重金属, 电子）"
                />
              </div>

              <div class="form-item">
                <label class="form-label">
                  风格权重
                  <span class="slider-value">{{ formData.styleWeight }}</span>
                </label>
                <input
                  v-model.number="formData.styleWeight"
                  type="range"
                  class="form-slider"
                  min="0"
                  max="1"
                  step="0.01"
                />
                <div class="slider-hints">
                  <span>自由发挥</span>
                  <span>严格遵循</span>
                </div>
              </div>

              <div class="form-item">
                <label class="form-label">
                  创意程度
                  <span class="slider-value">{{ formData.weirdnessConstraint }}</span>
                </label>
                <input
                  v-model.number="formData.weirdnessConstraint"
                  type="range"
                  class="form-slider"
                  min="0"
                  max="1"
                  step="0.01"
                />
                <div class="slider-hints">
                  <span>保守</span>
                  <span>大胆创新</span>
                </div>
              </div>

              <div class="form-item">
                <label class="form-label">
                  音频质量权重
                  <span class="slider-value">{{ formData.audioWeight }}</span>
                </label>
                <input
                  v-model.number="formData.audioWeight"
                  type="range"
                  class="form-slider"
                  min="0"
                  max="1"
                  step="0.01"
                />
                <div class="slider-hints">
                  <span>标准</span>
                  <span>极致</span>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- 生成按钮 -->
        <button
          class="generate-btn"
          :class="{ loading: isGenerating }"
          :disabled="!canGenerate || isGenerating"
          @click="handleGenerate"
        >
          <template v-if="isGenerating">
            <span class="loading-spinner"></span>
            AI 正在创作中...
          </template>
          <template v-else> 开始创作 </template>
        </button>
      </div>

      <!-- 右侧：生成结果 -->
      <div class="result-area">
        <div class="section-title">
          <span class="title-dot result"></span>
          创作记录
        </div>

        <!-- 当前生成任务 -->
        <div v-if="generatedList.length > 0" class="result-list">
          <div
            v-for="(item, index) in generatedList"
            :key="'task-' + index"
            class="result-item"
            :class="{ generating: item.status === 'generating' }"
          >
            <div class="result-info">
              <span class="result-title">{{ item.title || '未命名作品' }}</span>
              <span class="result-style">{{ item.style }}</span>
            </div>
            <div class="result-meta-row">
              <span class="result-time">{{ formatCreateTime(item.createdAt) }}</span>
              <span v-if="item.status === 'generating'" class="status-tag generating">
                生成中...
              </span>
              <span v-else-if="item.status === 'success'" class="status-tag success">
                已完成
              </span>
              <span v-else class="status-tag failed"> 失败 </span>
            </div>
            <div v-if="item.status === 'success' && item.audioUrl" class="result-actions">
              <button class="action-btn play" @click="playResult(item)">▶ 播放</button>
            </div>
          </div>
        </div>

        <!-- 历史生成歌曲（来自 store / localStorage） -->
        <div v-if="aiMusicStore.songList.length > 0" class="history-section">
          <div class="section-subtitle">历史作品</div>
          <div class="result-list">
            <div
              v-for="(song, idx) in aiMusicStore.songList"
              :key="'song-' + song.id"
              class="history-card"
            >
              <div class="history-card-body">
                <div class="history-cover" v-if="song.image">
                  <img :src="song.image" alt="" />
                  <div class="cover-play" @click="playSong(song)">▶</div>
                </div>
                <div class="history-detail">
                  <span class="history-name">{{ song.name }}</span>
                  <div class="history-meta">
                    <span class="history-style-tag">{{ song.singer }}</span>
                    <span class="history-time">
                      {{ formatCreateTime(aiMusicStore.sunoList[idx]?.createTime) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="history-card-footer">
                <button
                  class="action-btn delete"
                  @click="aiMusicStore.removeSong(song.id)"
                >
                  删除
                </button>
                <button
                  v-if="aiMusicStore.sunoList[idx]?.audioUrl"
                  class="action-btn download"
                  @click="downloadSong(aiMusicStore.sunoList[idx]!.audioUrl, song.name)"
                >
                  下载
                </button>
                <button class="action-btn play" @click="playSong(song)">▶ 播放</button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="generatedList.length === 0 && aiMusicStore.songList.length === 0"
          class="empty-result"
        >
          <div class="empty-icon">♪</div>
          <p>还没有作品，开始你的创作之旅吧</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'music-creative-workshop' });

import { generateAIMusic, getAIMusicDetail } from '@/api';
import { useAIMusicStore } from '@/stores/aiMusic';
import { usePlayerStore } from '@/stores/index';
import type { SongDetailItem } from '@/types/dataTypes';

// ------------------------------ 类型 ------------------------------
interface GenerateFormData {
  customMode: boolean;
  title: string;
  prompt: string;
  style: string;
  model: string;
  instrumental: boolean;
  vocalGender: string;
  negativeTags: string;
  styleWeight: number;
  weirdnessConstraint: number;
  audioWeight: number;
}

interface GeneratedItem {
  title: string;
  style: string;
  status: 'generating' | 'success' | 'failed';
  audioUrl?: string;
  taskId?: string;
  createdAt: number;
}

// ------------------------------ 数据 ------------------------------
const showAdvanced = ref(false);
const isGenerating = ref(false);

const styleOptions = [
  '流行',
  '摇滚',
  '古典',
  '电子',
  '爵士',
  'R&B',
  '民谣',
  '嘻哈',
  '乡村',
  '金属',
  '蓝调',
  '轻音乐',
];

const modelOptions = [
  { label: 'V4', value: 'V4' },
  { label: 'V4.5', value: 'V4_5' },
  { label: 'V4.5+', value: 'V4_5PLUS' },
  { label: 'V4.5 All', value: 'V4_5ALL' },
  { label: 'V5', value: 'V5' },
  { label: 'V5.5（推荐）', value: 'V5_5' },
];

const formData = reactive<GenerateFormData>({
  customMode: true,
  title: '',
  prompt: '',
  style: '',
  model: 'V5',
  instrumental: false,
  vocalGender: 'f',
  negativeTags: '',
  styleWeight: 0.65,
  weirdnessConstraint: 0.65,
  audioWeight: 0.65,
});

const generatedList = ref<GeneratedItem[]>([]);

// ------------------------------ computed ------------------------------
const needsPrompt = computed(() => {
  if (!formData.customMode) return true;
  return !formData.instrumental;
});

const promptMaxLength = computed(() => {
  if (!formData.customMode) return 500;
  return formData.model === 'V4' ? 3000 : 5000;
});

const titleMaxLength = computed(() => {
  return ['V4', 'V4_5ALL'].includes(formData.model) ? 80 : 100;
});

const promptPlaceholder = computed(() => {
  if (formData.customMode) {
    return '输入歌词内容，将作为精确歌词在生成的音乐中演唱...';
  }
  return '描述你想要的音乐风格、情感和意境，歌词将根据描述自动生成...';
});

const canGenerate = computed(() => {
  if (formData.customMode) {
    if (!formData.title || !formData.style) return false;
    if (!formData.instrumental && !formData.prompt) return false;
    return true;
  }
  return formData.prompt.length > 0;
});

// ------------------------------ 方法 ------------------------------
const { proxy } = getCurrentInstance()!;
const aiMusicStore = useAIMusicStore();
const playerStore = usePlayerStore();

const POLL_INTERVAL = 20000;
const POLL_MAX_ATTEMPTS = 24;

async function pollMusicDetail(taskId: string): Promise<'SUCCESS' | 'FAILED'> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const res = await getAIMusicDetail(taskId);
    if (res.code === 200 && res.data) {
      if (res.data.status === 'SUCCESS') {
        const sunoData = res.data.response?.sunoData;
        if (sunoData?.length) {
          aiMusicStore.addSongs(sunoData, taskId);
        }
        return 'SUCCESS';
      }
      if (res.data.status === 'FAILED') {
        return 'FAILED';
      }
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
  return 'FAILED';
}

async function handleGenerate() {
  if (!canGenerate.value || isGenerating.value) return;

  isGenerating.value = true;

  const newItem: GeneratedItem = {
    title: formData.title,
    style: formData.style,
    status: 'generating',
    createdAt: Date.now(),
  };
  generatedList.value.unshift(newItem);

  try {
    const params: Record<string, unknown> = {
      customMode: formData.customMode,
      instrumental: formData.instrumental,
      model: formData.model,
      styleWeight: formData.styleWeight,
      weirdnessConstraint: formData.weirdnessConstraint,
      audioWeight: formData.audioWeight,
    };

    if (formData.customMode) {
      params.title = formData.title;
      params.style = formData.style;
      if (!formData.instrumental) {
        params.prompt = formData.prompt;
      }
    } else {
      params.prompt = formData.prompt;
    }

    if (!formData.instrumental && formData.vocalGender) {
      params.vocalGender = formData.vocalGender;
    }

    if (formData.negativeTags) {
      params.negativeTags = formData.negativeTags;
    }

    const res = await generateAIMusic(params);

    if (res.code === 200 && res.data?.taskId) {
      newItem.taskId = res.data.taskId;
      proxy?.$bbToast?.('音乐生成任务已提交，请耐心等待...');

      const status = await pollMusicDetail(res.data.taskId);

      if (status === 'SUCCESS') {
        newItem.status = 'success';
        const song = aiMusicStore.songList.find((s) => s.taskId === res.data.taskId);
        if (song) newItem.audioUrl = song.url;
        proxy?.$bbToast?.('音乐创作完成！');
      }
    } else {
      newItem.status = 'failed';
      proxy?.$bbToast?.('生成失败，请稍后重试');
    }
  } catch {
    newItem.status = 'failed';
    proxy?.$bbToast?.('请求失败，请检查网络连接');
  } finally {
    isGenerating.value = false;
  }
}

function playResult(item: GeneratedItem) {
  if (!item.taskId) return;
  const song = aiMusicStore.songList.find((s) => s.taskId === item.taskId);
  if (song) {
    playerStore.selectAddPlay(song);
  }
}

function playSong(song: SongDetailItem) {
  playerStore.selectAddPlay(song);
}

async function downloadSong(url: string, name: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${name}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.error('[下载失败]', e);
    window.open(url, '_blank');
  }
}

function formatCreateTime(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 调试用，上线前删除
// onMounted(async () => {
//   const TEST_TASK_ID = '1265e0509ea9104b89a5028a1fe30406';
//   try {
//     const res = await getAIMusicDetail(TEST_TASK_ID);
//     if (res.code === 200 && res.data?.status === 'SUCCESS') {
//       const sunoData = res.data.response?.sunoData;
//       if (sunoData?.length) {
//         aiMusicStore.addSongs(sunoData, TEST_TASK_ID);
//         const first = sunoData[0]!;
//         generatedList.value.unshift({
//           title: first.title,
//           style: first.tags,
//           status: 'success',
//           audioUrl: first.sourceAudioUrl,
//           taskId: TEST_TASK_ID,
//           createdAt: first.createTime,
//         });
//       }
//     }
//   } catch (e) {
//     console.warn('[模拟数据] 获取测试任务失败:', e);
//   }
// });
</script>

<style lang="less" scoped>
.creative-workshop {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.workshop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-info {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.header-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.workshop-body {
  flex: 1;
  display: flex;
  gap: 0;
  overflow: hidden;
}

.form-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.08);

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
}

.result-area {
  width: 320px;
  flex-shrink: 0;
  padding: 20px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
}

// ---- 表单区块 ----
.form-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 16px;

  &.clickable {
    cursor: pointer;
    user-select: none;

    &:hover {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

.title-dot {
  width: 4px;
  height: 16px;
  border-radius: 2px;

  &.required {
    background: linear-gradient(180deg, #667eea, #764ba2);
  }

  &.optional {
    background: linear-gradient(180deg, #f093fb, #f5576c);
  }

  &.result {
    background: linear-gradient(180deg, #4facfe, #00f2fe);
  }
}

.toggle-arrow {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  transition: transform 0.3s;
  margin-left: auto;

  &.expanded {
    transform: rotate(90deg);
  }
}

// ---- 表单项 ----
.form-item {
  margin-bottom: 18px;

  &.row {
    display: flex;
    align-items: center;
    gap: 12px;

    .form-label {
      margin-bottom: 0;
      min-width: 80px;
    }
  }
}

.form-label {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.required-star {
  color: #f5576c;
  margin-left: 2px;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 4px;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: all 0.3s;

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  &:focus {
    border-color: rgba(102, 126, 234, 0.6);
    background: rgba(255, 255, 255, 0.1);
  }
}

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 100px;
  box-sizing: border-box;
  font-family: inherit;
  line-height: 1.6;
  transition: all 0.3s;

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  &:focus {
    border-color: rgba(102, 126, 234, 0.6);
    background: rgba(255, 255, 255, 0.1);
  }
}

// ---- 风格标签 ----
.style-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.style-tag {
  padding: 6px 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  &.active {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.2);
    color: #fff;
  }
}

// ---- 模式切换标签 ----
.mode-tabs {
  display: flex;
  gap: 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.mode-tab {
  flex: 1;
  padding: 8px 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  cursor: pointer;
  transition: all 0.25s;
  background: transparent;

  &:first-child {
    border-right: 1px solid rgba(255, 255, 255, 0.15);
  }

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
  }

  &.active {
    color: #fff;
    background: rgba(102, 126, 234, 0.25);
  }
}

.form-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 6px;
  line-height: 1.5;
}

.style-input {
  margin-top: 0;
}

// ---- Radio 组 ----
.radio-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.radio-item {
  padding: 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  &.active {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.2);
    color: #fff;
  }
}

// ---- Toggle ----
.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  position: relative;
  transition: background 0.3s;
  flex-shrink: 0;

  &.on {
    background: linear-gradient(135deg, #667eea, #764ba2);
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.3s;
  }

  &.on .toggle-thumb {
    transform: translateX(20px);
  }
}

.toggle-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

// ---- Slider ----
.form-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.15);
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
}

.slider-value {
  float: right;
  color: #667eea;
  font-weight: 500;
}

.slider-hints {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 4px;
}

// ---- 展开/收起动画 ----
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 600px;
}

.advanced-options {
  padding-top: 4px;
}

// ---- 生成按钮 ----
.generate-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
  margin-top: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.loading {
    background: linear-gradient(135deg, #434976 0%, #5a3670 100%);
  }
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ---- 结果区域 ----
.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
    opacity: 0.4;
  }

  p {
    font-size: 13px;
  }
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  padding: 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.generating {
    border-color: rgba(102, 126, 234, 0.3);
    animation: gentlePulse 2s ease-in-out infinite;
  }
}

@keyframes gentlePulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.15);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0);
  }
}

.result-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.result-style {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(102, 126, 234, 0.2);
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.result-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.result-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.status-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;

  &.generating {
    color: #667eea;
    background: rgba(102, 126, 234, 0.15);
  }

  &.success {
    color: #38ef7d;
    background: rgba(56, 239, 125, 0.15);
  }

  &.failed {
    color: #f5576c;
    background: rgba(245, 87, 108, 0.15);
  }
}

.result-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.25s;

  &.play {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;

    &:hover {
      box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
    }
  }

  &.delete {
    background: rgba(245, 87, 108, 0.15);
    color: #f5576c;

    &:hover {
      background: rgba(245, 87, 108, 0.3);
    }
  }

  &.download {
    background: rgba(64, 206, 143, 0.15);
    color: #40ce8f;
    text-decoration: none;

    &:hover {
      background: rgba(64, 206, 143, 0.3);
    }
  }
}

.history-section {
  margin-top: 16px;
}

.section-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.history-card {
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
  }
}

.history-card-body {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.history-cover {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
    font-size: 16px;
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.25s;
  }

  &:hover .cover-play {
    opacity: 1;
  }
}

.history-detail {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
}

.history-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.history-style-tag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(102, 126, 234, 0.2);
  color: rgba(255, 255, 255, 0.65);
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.history-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

.history-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

// ---- 响应式 ----
@media (max-width: 768px) {
  .workshop-body {
    flex-direction: column;
  }

  .form-area {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .result-area {
    width: 100%;
    max-height: 300px;
  }

  .workshop-header {
    padding: 12px 16px;
  }

  .header-title {
    font-size: 16px;
  }

  .header-desc {
    font-size: 12px;
  }
}
</style>
