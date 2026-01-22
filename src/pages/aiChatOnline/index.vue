<template>
  <div class="ai-chat">
    <!-- 头部操作栏 -->
    <div class="chat-header">
      <div class="header-left">
        <span class="chat-title">音乐小助手 (在线版)</span>
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
        <h3>你好！我是音乐小助手</h3>
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
          <div class="message-text">{{ msg.content }}</div>
        </div>
      </div>

      <!-- 正在输入的消息 -->
      <div v-if="isLoading" class="message-item assistant">
        <div class="message-avatar">
          <bb-icon type="robot" :size="24" />
        </div>
        <div class="message-content">
          <div class="message-text">
            {{ streamingContent || '思考中...' }}
            <span class="cursor-blink">|</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <input
        ref="inputRef"
        v-model="inputText"
        type="text"
        class="chat-input"
        placeholder="输入你想问的问题..."
        :disabled="isLoading"
        @keyup.enter="sendMessage"
      />
      <button
        class="send-btn"
        :disabled="isLoading || !inputText.trim()"
        @click="sendMessage"
      >
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'music-ai-chat-online' });

import { useAiChatOnlineStore } from '@/stores/aiChatOnline';
import { storeToRefs } from 'pinia';

// ------------------------------ Store ------------------------------
const aiChatStore = useAiChatOnlineStore();
const { messages, streamingContent, isLoading } = storeToRefs(aiChatStore);

// ------------------------------ 数据 ------------------------------
const inputText = ref('');
const inputRef = useTemplateRef<HTMLInputElement>('inputRef');
const messageListRef = useTemplateRef<HTMLDivElement>('messageListRef');
let abortController: AbortController | null = null; // 用于终止请求

// ------------------------------ 方法 ------------------------------

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
}

// 构建最近 N 条历史消息
function buildRecentHistory(limit = 10) {
  const history = aiChatStore.getChatHistory();
  return history.slice(-limit);
}

// 发送消息（chunked 流式返回）
async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  // 添加用户消息
  aiChatStore.addUserMessage(text);
  inputText.value = '';
  scrollToBottom();

  // 开始请求
  aiChatStore.setLoading(true);
  aiChatStore.setStreamingContent('正在生成回复...');

  // 创建新的 AbortController
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
        prompt: text,
        messages: history,
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
        aiChatStore.addAssistantMessage(
          `${streamingContent.value}\n\n[已终止]`,
        );
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
  margin-bottom: 20px;
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
  white-space: pre-wrap;
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
  gap: 12px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
