<template>
  <div class="ai-chat">
    <!-- 头部操作栏 -->
    <div class="chat-header">
      <div class="header-left">
        <span class="chat-title">{{ chatTitle }}</span>
      </div>
      <div class="header-btns">
        <button v-if="isLoading" class="stop-btn" @click="handleStopGeneration">
          <bb-icon type="pause" :size="16" />
          终止回答
        </button>
        <button
          class="clear-btn"
          :disabled="isLoading || messages.length === 0"
          @click="handleClearChat"
        >
          <bb-icon type="delete" :size="16" />
          清空对话
        </button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="messageListRef" class="message-list">
      <!-- 欢迎消息 -->
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">
          <bb-icon type="robot" :size="48" />
        </div>
        <h3>你好！我是{{ chatTitle }}</h3>
        <p>有什么我可以帮助你的吗？</p>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-item"
        :class="msg.role"
      >
        <div class="message-avatar">
          <bb-icon :type="msg.role === 'user' ? 'user' : 'robot'" :size="24" />
        </div>
        <div class="message-content">
          <div v-if="msg.role === 'assistant'" class="message-text markdown-body">
            <template
              v-for="(part, pi) in parseMessageParts(msg.content as string)"
              :key="pi"
            >
              <div
                v-if="part.type === 'text'"
                v-html="renderMarkdown(part.content)"
              ></div>
              <MusicCard v-else :name="part.name" :artist="part.artist" />
            </template>
          </div>
          <div v-else class="message-text">
            <template v-if="Array.isArray(msg.content)">
              <div
                v-for="(part, ci) in msg.content"
                :key="ci"
                :class="part.type === 'image_url' ? 'chat-image-row' : 'chat-text-row'"
              >
                <img
                  v-if="part.type === 'image_url'"
                  class="chat-image-thumb"
                  :src="part.image_url.url"
                  alt="图片"
                  @click="previewImageUrl = part.image_url.url"
                />
                <span v-else-if="part.type === 'text'">{{ part.text }}</span>
              </div>
            </template>
            <template v-else>{{ msg.content }}</template>
          </div>
        </div>
      </div>

      <!-- 正在输入的消息 -->
      <div v-if="isLoading" class="message-item assistant">
        <div class="message-avatar">
          <bb-icon type="robot" :size="24" />
        </div>
        <div class="message-content">
          <div v-if="streamingContent" class="message-text markdown-body">
            <span v-html="renderMarkdown(streamingContent)"></span>
            <span class="cursor-blink">|</span>
          </div>
          <div v-else class="message-text">
            <span>思考中...</span>
            <span class="cursor-blink">|</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div
      class="input-area"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      :class="{ 'is-dragging': isDragging }"
    >
      <!-- 图片预览条 -->
      <div v-if="pendingImages.length > 0 || imageUploading" class="image-preview-bar">
        <div v-if="imageUploading" class="image-uploading">
          <span class="upload-spinner"></span>
          图片上传中...
        </div>
        <div v-for="(img, idx) in pendingImages" :key="idx" class="image-preview-item">
          <img :src="img" alt="预览" @click="previewImageUrl = img" />
          <button class="image-remove-btn" @click="pendingImages.splice(idx, 1)">
            ×
          </button>
        </div>
      </div>
      <div class="input-row">
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          multiple
          class="hidden-file-input"
          @change="handleFileSelect"
        />
        <button
          class="upload-btn"
          :disabled="isLoading || imageUploading"
          @click="($refs.fileInputRef as HTMLInputElement)?.click()"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path
              d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
            />
          </svg>
        </button>
        <input
          ref="inputRef"
          v-model="inputText"
          type="text"
          class="chat-input"
          placeholder="输入问题，可粘贴图片链接或拖入图片..."
          :disabled="isLoading"
          @keyup.enter="sendMessage"
        />
        <button
          class="send-btn"
          :disabled="
            isLoading ||
            imageUploading ||
            (!inputText.trim() && pendingImages.length === 0)
          "
          @click="sendMessage"
        >
          发送
        </button>
      </div>
    </div>

    <!-- 图片预览蒙层 -->
    <teleport to="body">
      <div
        v-if="previewImageUrl"
        class="image-preview-overlay"
        @click.self="closePreview"
        @wheel.prevent="handlePreviewWheel"
      >
        <img
          :src="previewImageUrl"
          :style="{ transform: `scale(${previewScale})` }"
          alt="大图预览"
          @click.stop
        />
        <span class="preview-close-btn" @click="closePreview">×</span>
        <span v-if="previewScale !== 1" class="preview-scale-hint"
          >{{ Math.round(previewScale * 100) }}%</span
        >
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'music-ai-chat-online' });

import { useAiChatOnlineStore, type ContentPart } from '@/stores/aiChatOnline';
import { storeToRefs } from 'pinia';
import { marked } from 'marked';
import MusicCard from '@/components/music-card/index.vue';
import { fileToDataUrl, extractImageAndText, isImageFile } from './imageUpload';

type MessagePart =
  | { type: 'text'; content: string }
  | { type: 'music'; name: string; artist: string };

const MUSIC_TAG_RE = /\[play:(.+?):(.+?)\]/g;

function parseMessageParts(content: string): MessagePart[] {
  const parts: MessagePart[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(MUSIC_TAG_RE)) {
    const before = content.slice(lastIndex, match.index);
    if (before) parts.push({ type: 'text', content: before });
    parts.push({ type: 'music', name: match[1]!, artist: match[2]! });
    lastIndex = match.index! + match[0].length;
  }

  const tail = content.slice(lastIndex);
  if (tail) parts.push({ type: 'text', content: tail });

  return parts.length > 0 ? parts : [{ type: 'text', content }];
}

// ------------------------------ Store ------------------------------
import { usePlayerStore } from '@/stores/index';
const playerStore = usePlayerStore();
const aiChatStore = useAiChatOnlineStore();
const { messages, streamingContent, isLoading } = storeToRefs(aiChatStore);

// ------------------------------ 数据 ------------------------------
const inputText = ref('');
const inputRef = useTemplateRef<HTMLInputElement>('inputRef');
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef');
const messageListRef = useTemplateRef<HTMLDivElement>('messageListRef');
let abortController: AbortController | null = null;

const isOffline = ref(!navigator.onLine);
const chatTitle = computed(() =>
  isOffline.value ? '音乐小助手（离线本地版）' : '音乐小助手',
);

const pendingImages = ref<string[]>([]);
const imageUploading = ref(false);
const isDragging = ref(false);
const previewImageUrl = ref('');
const previewScale = ref(1);

function closePreview() {
  previewImageUrl.value = '';
  previewScale.value = 1;
}

function handlePreviewWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  previewScale.value = Math.min(5, Math.max(0.2, previewScale.value + delta));
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && previewImageUrl.value) {
    closePreview();
  }
}

function handleOnline() {
  isOffline.value = false;
}
function handleOffline() {
  isOffline.value = true;
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
});
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});

// ------------------------------ 方法 ------------------------------
const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const markdownRenderer = new marked.Renderer();
markdownRenderer.html = (html) => escapeHtml(String(html));

marked.setOptions({ breaks: false, gfm: true, renderer: markdownRenderer });

function renderMarkdown(content: string) {
  return marked.parse(content || '') as string;
}

// ------------------------------ 图片上传 ------------------------------
const MAX_IMAGES = 8;

async function handleImageUpload(files: File[]) {
  const images = files.filter(isImageFile);
  if (images.length === 0) return;
  const remaining = MAX_IMAGES - pendingImages.value.length;
  if (remaining <= 0) {
    alert(`最多同时上传 ${MAX_IMAGES} 张图片`);
    return;
  }
  const toUpload = images.slice(0, remaining);
  imageUploading.value = true;
  try {
    const results = await Promise.all(toUpload.map(fileToDataUrl));
    pendingImages.value.push(...results);
  } catch (e) {
    console.error('图片读取失败', e);
    alert('图片读取失败，请重试');
  } finally {
    imageUploading.value = false;
  }
}

function handleFileSelect(e: Event) {
  const fileList = (e.target as HTMLInputElement).files;
  if (fileList && fileList.length > 0) {
    handleImageUpload(Array.from(fileList));
  }
  if (fileInputRef.value) fileInputRef.value.value = '';
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const fileList = e.dataTransfer?.files;
  if (fileList && fileList.length > 0) {
    handleImageUpload(Array.from(fileList));
  }
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
}

// 构建最近 N 条历史消息（历史中的多模态消息只保留文本，避免 base64 图片数据污染上下文）
function buildRecentHistory(limit = 10) {
  const history = aiChatStore.getChatHistory();
  return history.slice(-limit).map((msg) => {
    if (Array.isArray(msg.content)) {
      const textParts = msg.content
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join(' ');
      return { ...msg, content: textParts || '[图片]' };
    }
    return msg;
  });
}

// 发送消息（chunked 流式返回）
async function sendMessage() {
  const text = inputText.value.trim();
  if (!text && pendingImages.value.length === 0) return;
  if (isLoading.value || imageUploading.value) return;

  let prompt: string | ContentPart[] = text;
  let storeContent: string | ContentPart[] = text;

  if (pendingImages.value.length > 0) {
    const parts: ContentPart[] = pendingImages.value.map((url) => ({
      type: 'image_url' as const,
      image_url: { url },
    }));
    if (text) parts.push({ type: 'text', text });
    prompt = parts;
    storeContent = parts;
    pendingImages.value = [];
  } else {
    const extracted = extractImageAndText(text);
    if (extracted.imageUrl) {
      const parts: ContentPart[] = [
        { type: 'image_url', image_url: { url: extracted.imageUrl } },
      ];
      if (extracted.text) parts.push({ type: 'text', text: extracted.text });
      prompt = parts;
      storeContent = parts;
    }
  }

  aiChatStore.addUserMessage(storeContent);
  inputText.value = '';
  scrollToBottom();

  aiChatStore.setLoading(true);
  aiChatStore.setStreamingContent('正在生成回复...');

  abortController = new AbortController();
  const currentAbortController = abortController;

  try {
    const baseURL = import.meta.env.VITE_BASE_API_URL;
    const url = `${baseURL}/gpt/chat`;
    const history = buildRecentHistory(10);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        messages: history,
        uid: playerStore.uid || undefined,
      }),
      signal: currentAbortController.signal,
    });
    if (!response.ok) {
      throw new Error(`请求失败：${response.status}`);
    }
    let replyText = '';
    // chunked 流式读取
    const reader = response.body!.getReader();
    const decoder = new TextDecoder('utf-8');
    aiChatStore.setStreamingContent('');

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        replyText += chunk;
        aiChatStore.setStreamingContent(replyText);
        // scrollToBottom();
      }
    }

    if (!replyText) {
      throw new Error('响应内容为空');
    }

    aiChatStore.addAssistantMessage(replyText);
  } catch (error: unknown) {
    if (
      currentAbortController.signal.aborted ||
      (error instanceof Error && error.name === 'AbortError')
    ) {
      if (streamingContent.value) {
        aiChatStore.addAssistantMessage(`${streamingContent.value}\n\n[已终止]`);
      }
    } else {
      console.error('AI 请求失败:', error);
      aiChatStore.addAssistantMessage('抱歉，请求失败了，请稍后重试。');
    }
  } finally {
    abortController = null;
    aiChatStore.setLoading(false);
    aiChatStore.setStreamingContent('');
    scrollToBottom();
    nextTick(() => inputRef.value?.focus());
  }
}

// 终止生成
function handleStopGeneration() {
  if (abortController) {
    abortController.abort();
    aiChatStore.setLoading(false);
    if (streamingContent.value) {
      aiChatStore.addAssistantMessage(streamingContent.value + '\n\n[已终止]');
      aiChatStore.setStreamingContent('');
    } else {
      aiChatStore.addAssistantMessage(streamingContent.value + '[已终止]');
    }
    nextTick(() => inputRef.value?.focus());
    abortController = null;
  }
}

// 清空对话
function handleClearChat() {
  aiChatStore.clearChat();
}

// ------------------------------ 生命周期 ------------------------------
onMounted(() => {
  scrollToBottom();
});

onActivated(() => {
  scrollToBottom();
});
</script>

<style lang="less" scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-title {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

.header-btns {
  display: flex;
  gap: 8px;
}

.stop-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid #ff6b6b;
  border-radius: 6px;
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  animation: pulse 1.5s infinite;

  &:hover {
    background: rgba(255, 107, 107, 0.25);
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(255, 107, 107, 0);
  }
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    border-color: #ff6b6b;
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
}

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);

  .welcome-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    color: #fff;
  }

  h3 {
    font-size: 20px;
    color: #fff;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
  }
}

.message-item {
  display: flex;
  margin-bottom: 40px;
  animation: fadeIn 0.3s ease;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin-right: 12px;
      margin-left: 60px;
    }

    .message-avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  }

  &.assistant {
    .message-content {
      background: rgba(255, 255, 255, 0.1);
      margin-left: 12px;
      margin-right: 60px;
    }

    .message-avatar {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  color: #fff;
  line-height: 1.6;
  word-break: break-word;
  white-space: normal;
}

:deep(.markdown-body) {
  white-space: normal;

  h1,
  h2,
  h3 {
    font-weight: 700;
    line-height: 1.4;
    margin: 12px 0 8px;
  }

  h1 {
    font-size: 18px;
  }

  h2 {
    font-size: 16px;
  }

  h3 {
    font-size: 14px;
  }

  strong {
    font-weight: 700;
  }

  p {
    margin: 8px 0;
  }

  ul,
  ol {
    list-style-position: outside;
    padding-left: 18px;
    margin: 8px 0 12px;
  }

  ul {
    list-style: disc;
  }

  ol {
    list-style: decimal;
  }

  li {
    margin: 5px 0;
  }

  code {
    padding: 0 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.12);
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
      'Courier New', monospace;
  }

  pre {
    padding: 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    overflow: auto;
  }

  pre code {
    padding: 0;
    background: transparent;
  }
}

.cursor-blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: outline 0.2s;

  &.is-dragging {
    outline: 2px dashed rgba(102, 126, 234, 0.7);
    outline-offset: -4px;
    background: rgba(102, 126, 234, 0.08);
  }
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.hidden-file-input {
  display: none;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.image-preview-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
}

.image-uploading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.upload-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.image-preview-item {
  position: relative;
  display: inline-block;

  img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.85;
    }
  }
}

.image-remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 60, 60, 0.9);
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-image-row {
  margin: 6px 0;
}

.chat-text-row {
  margin: 2px 0;
}

.chat-image-thumb {
  display: block;
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
}

.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  cursor: pointer;

  img {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 8px;
    cursor: default;
    transition: transform 0.15s ease;
  }
}

.preview-close-btn {
  position: fixed;
  top: 20px;
  right: 24px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.25);
  }
}

.preview-scale-hint {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 14px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  pointer-events: none;
}

.chat-input {
  flex: 1;
  height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 20px;
  height: 44px;
  border: none;
  border-radius: 22px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }

  .message-item {
    &.user .message-content {
      margin-left: 20px;
    }

    &.assistant .message-content {
      margin-right: 20px;
    }
  }

  .chat-header {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .header-left {
    gap: 8px;
  }

  .chat-title {
    font-size: 14px;
  }

  .clear-btn,
  .stop-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>
