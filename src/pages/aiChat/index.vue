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
import ollama from 'ollama';
import type { Message } from 'ollama';
import { useAiChatStore } from '@/stores/aiChat';
import { storeToRefs } from 'pinia';
import { getTools, executeToolCall } from './mcp';

// ------------------------------ Store ------------------------------
const aiChatStore = useAiChatStore();
const { messages, streamingContent, isLoading, selectedModel } =
  storeToRefs(aiChatStore);

// ------------------------------ 配置 ------------------------------
// 可选模型列表（支持 Tool Calling 的模型）
const MODEL_OPTIONS = [
  { value: 'qwen2.5:0.5b', label: '⚡ 极速' },
  { value: 'qwen3:4b', label: '🚀 快速' },
  { value: 'mistral:7b', label: '⚖️ 均衡' },
  { value: 'deepseek-r1:latest', label: '🧠 推理-均衡' },
  { value: 'qwen3:8b', label: '🧠 推理-强' },
];

// 获取所有 MCP 工具定义
const tools = getTools();

// System Prompt - 工具检测时使用（指导模型调用工具）
const TOOL_SYSTEM_PROMPT = `你是一个音乐小助手。你有以下工具可以使用：
1. add - 用于数学加法计算，当用户需要计算两个数相加时，必须使用此工具
2. searchSongsByMood - 根据情绪/心情推荐歌曲（如：开心、悲伤、放松）
3. searchSongsByName - 根据歌手名称搜索该歌手的歌曲
4. searchSongsByTitle - 根据歌曲名搜索歌曲的详细信息
5. searchSongsByLyrics - 根据歌词片段查找歌曲

重要规则：
- 当用户要求进行数学计算时，必须调用 add 工具
- 当用户想根据心情/情绪找歌曲时，调用 searchSongsByMood 工具
- 当用户想搜索某个歌手的歌曲时，调用 searchSongsByName 工具
- 当用户想查找某首歌曲的信息时，调用 searchSongsByTitle 工具
- 当用户提供一段歌词想找歌曲时，调用 searchSongsByLyrics 工具
- 工具返回的结果是准确的，请直接使用工具返回的结果回复用户`;

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

// 发送消息（支持 Tool Calling）
async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  // 添加用户消息
  aiChatStore.addUserMessage(text);
  inputText.value = '';
  scrollToBottom();

  // 开始请求
  aiChatStore.setLoading(true);
  aiChatStore.setStreamingContent('');

  // 创建新的 AbortController
  abortController = new AbortController();
  const currentAbortController = abortController; // 保存当前引用

  try {
    // 当前用户消息（不带历史，确保工具能被正确触发）
    const currentUserMessage: Message = { role: 'user', content: text };

    // 工具检测消息：只带 system + 当前消息
    const messagesForToolCheck: Message[] = [
      { role: 'system', content: TOOL_SYSTEM_PROMPT },
      currentUserMessage,
    ];

    // 第一次调用：检测是否需要工具
    const response = await ollama.chat({
      model: selectedModel.value,
      messages: messagesForToolCheck,
      tools: tools,
      stream: false,
    });

    // 检查是否有工具调用
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      console.log('🔧 检测到工具调用:', response.message.tool_calls);

      // 显示工具调用状态
      aiChatStore.setStreamingContent('正在调用工具...');

      // 构建工具调用消息（只含当前轮次）
      const messagesWithTools: Message[] = [
        { role: 'system', content: TOOL_SYSTEM_PROMPT },
        currentUserMessage,
        response.message, // AI 的工具调用消息
      ];

      // 执行所有工具调用
      for (const toolCall of response.message.tool_calls) {
        if (currentAbortController.signal.aborted) break;

        const toolResult = await executeToolCall(toolCall);

        // 添加工具结果
        messagesWithTools.push({
          role: 'tool',
          content: toolResult,
        });
      }

      // 如果没有被终止，让模型生成最终回复
      if (!currentAbortController.signal.aborted) {
        aiChatStore.setStreamingContent('正在生成回复...');

        // 第二次调用：根据工具结果生成回复（流式）
        const finalResponse = await ollama.chat({
          model: selectedModel.value,
          messages: messagesWithTools,
          stream: true,
        });

        aiChatStore.setStreamingContent('');

        for await (const part of finalResponse) {
          if (currentAbortController.signal.aborted) break;
          aiChatStore.appendStreamingContent(part.message.content);
        }
      }
    } else {
      // 没有工具调用，普通对话（可以带历史增强上下文）
      aiChatStore.setStreamingContent('');

      const chatHistory = aiChatStore.getChatHistory().slice(-10);
      const messagesForChat: Message[] = [...chatHistory];

      const streamResponse = await ollama.chat({
        model: selectedModel.value,
        messages: messagesForChat,
        stream: true,
      });

      for await (const part of streamResponse) {
        if (currentAbortController.signal.aborted) break;
        aiChatStore.appendStreamingContent(part.message.content);
      }
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
    nextTick(() => inputRef.value?.focus());
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
