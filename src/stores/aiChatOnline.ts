import { defineStore } from 'pinia';

// ------------------------------ 类型定义 ------------------------------
export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | ContentPart[];
}

// ------------------------------ 过期时间配置 ------------------------------
const EXPIRE_TIME = 1 * 24 * 60 * 60 * 1000;

// 带过期时间的序列化器
const createExpiringSerializer = (expireTime: number) => ({
  serialize: (value: unknown) => {
    return JSON.stringify({
      data: value,
      timestamp: Date.now(),
    });
  },
  deserialize: (value: string) => {
    try {
      const { data, timestamp } = JSON.parse(value);
      // 检查是否过期
      if (Date.now() - timestamp > expireTime) {
        return null; // 返回 null 会使用默认值
      }
      return data;
    } catch {
      return null;
    }
  },
});

// ------------------------------ Store ------------------------------
export const useAiChatOnlineStore = defineStore('aiChatOnline', {
  state: () => ({
    messages: [] as ChatMessage[], // 消息列表
    streamingContent: '', // 流式输出的内容
    isLoading: false, // 是否正在加载
  }),

  // 持久化配置
  persist: {
    key: 'ai-chat-online-store',
    pick: ['messages'],
    serializer: createExpiringSerializer(EXPIRE_TIME),
  },

  actions: {
    // 添加用户消息
    addUserMessage(content: string | ContentPart[]) {
      this.messages.push({ role: 'user', content });
    },

    // 添加 AI 消息
    addAssistantMessage(content: string) {
      this.messages.push({ role: 'assistant', content });
    },

    // 设置流式内容
    setStreamingContent(content: string) {
      this.streamingContent = content;
    },

    // 追加流式内容
    appendStreamingContent(content: string) {
      this.streamingContent += content;
    },

    // 设置加载状态
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    // 清空对话（重新开始）
    clearChat() {
      this.messages = [];
      this.streamingContent = '';
      this.isLoading = false;
    },

    // 获取对话历史（用于发送给 AI）
    getChatHistory(): ChatMessage[] {
      return this.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    },
  },
});
