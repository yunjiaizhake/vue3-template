import type { Tool } from 'ollama';

/**
 * MCP 工具配置接口
 */
export interface McpToolConfig {
  /** Ollama 工具定义（用于发送给模型） */
  tool: Tool;
  /** 工具执行函数 */
  execute: (args: Record<string, unknown>) => Promise<string>;
}
