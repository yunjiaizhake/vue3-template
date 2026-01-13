<template>
  <div class="ai-chat">
    <!-- 头部操作栏 -->
    <div class="chat-header">
      <div class="header-left">
        <span class="chat-title">音乐小助手</span>
        <select
          v-model="selectedModel"
          class="model-select"
          :disabled="isLoading"
        >
          <option
            v-for="model in MODEL_OPTIONS"
            :key="model.value"
            :value="model.value"
          >
            {{ model.label }}
          </option>
        </select>
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
import ollama from 'ollama';
import { useAiChatStore } from '@/stores/aiChat';
import { storeToRefs } from 'pinia';

// ------------------------------ Store ------------------------------
const aiChatStore = useAiChatStore();
const { messages, streamingContent, isLoading, selectedModel } =
  storeToRefs(aiChatStore);

// ------------------------------ 配置 ------------------------------
// 可选模型列表
const MODEL_OPTIONS = [
  { value: 'qwen2.5:0.5b', label: '⚡ 极速' },
  { value: 'qwen3:4b', label: '🚀 快速' },
  { value: 'mistral:7b', label: '⚖️ 均衡' },
  { value: 'qwen3:8b', label: '🧠 推理-均衡' },
  { value: 'deepseek-r1:latest', label: '🧠 推理-强' },
];

// ------------------------------ 数据 ------------------------------
const inputText = ref('');
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

// 发送消息
async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  // 添加用户消息
  aiChatStore.addUserMessage(text);
  inputText.value = '';
  scrollToBottom();

  // 开始流式请求
  aiChatStore.setLoading(true);
  aiChatStore.setStreamingContent('');

  // 创建新的 AbortController
  abortController = new AbortController();
  const currentAbortController = abortController; // 保存当前引用

  try {
    // 获取对话历史
    const chatHistory = aiChatStore.getChatHistory();

    // 使用流式 API
    // 只保留最近 10 条对话历史，减少上下文长度以加快响应
    const recentHistory = chatHistory.slice(-10);

    const response = await ollama.chat({
      model: selectedModel.value,
      messages: recentHistory,
      stream: true,
    });

    // 处理流式响应
    for await (const part of response) {
      // 检查是否被终止（使用保存的引用，避免被置空后检查失效）
      if (currentAbortController.signal.aborted) {
        break;
      }
      aiChatStore.appendStreamingContent(part.message.content);
    }

    // 检查是否是因为终止而退出
    if (currentAbortController.signal.aborted) {
      if (streamingContent.value) {
        aiChatStore.addAssistantMessage(
          streamingContent.value + '\n\n[已终止]',
        );
      }
    } else if (streamingContent.value) {
      // 正常完成，添加到消息列表
      aiChatStore.addAssistantMessage(streamingContent.value);
    }
  } catch (error: unknown) {
    // 如果是主动终止，不显示错误
    if (
      currentAbortController.signal.aborted ||
      (error instanceof Error && error.name === 'AbortError')
    ) {
      if (streamingContent.value) {
        aiChatStore.addAssistantMessage(
          streamingContent.value + '\n\n[已终止]',
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
  }
}

// 终止生成
function handleStopGeneration() {
  if (abortController) {
    abortController.abort();
    // 立即更新 UI 状态，让用户知道终止操作已触发
    aiChatStore.setLoading(false);
    if (streamingContent.value) {
      aiChatStore.addAssistantMessage(streamingContent.value + '\n\n[已终止]');
      aiChatStore.setStreamingContent('');
    }
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

.model-select {
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: #1a1a2e;
    color: #fff;
  }
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

  .model-select {
    padding: 4px 8px;
    font-size: 12px;
  }

  .clear-btn,
  .stop-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>
