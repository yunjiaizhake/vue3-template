import type { Tool, ToolCall } from 'ollama';
import type { McpToolConfig } from './types';

// 导入所有工具
import { addTool } from './add';
import { searchSongsByMoodTool } from './searchSongsByMood';
import { searchSongsByNameTool } from './searchSongsByName';
import { searchSongsByTitleTool } from './searchSongsByTitle';
import { searchSongsByLyricsTool } from './searchSongsByLyrics';

// 导出类型
export type { McpToolConfig } from './types';

/**
 * 所有注册的 MCP 工具配置
 * 新增工具时只需在这里添加即可
 */
const mcpToolConfigs: McpToolConfig[] = [
  addTool,
  searchSongsByMoodTool,
  searchSongsByNameTool,
  searchSongsByTitleTool,
  searchSongsByLyricsTool,
];

/**
 * 工具名称到执行函数的映射
 */
const toolExecutorMap = new Map<
  string,
  (args: Record<string, unknown>) => Promise<string>
>();

// 构建映射
mcpToolConfigs.forEach((config) => {
  const toolName = config.tool.function.name;
  toolExecutorMap.set(toolName!, config.execute);
});

/**
 * 获取所有工具定义（用于发送给 Ollama）
 */
export function getTools(): Tool[] {
  return mcpToolConfigs.map((config) => config.tool);
}

/**
 * 执行工具调用
 * @param toolCall - Ollama 返回的工具调用信息
 * @returns 工具执行结果
 */
export async function executeToolCall(toolCall: ToolCall): Promise<string> {
  const { name, arguments: args } = toolCall.function;

  console.log(`🔧 执行工具: ${name}`, args);

  const executor = toolExecutorMap.get(name);

  if (!executor) {
    console.warn(`⚠️ 未知工具: ${name}`);
    return `未知工具: ${name}`;
  }

  try {
    return await executor(args as Record<string, unknown>);
  } catch (error) {
    console.error(`❌ 工具执行失败: ${name}`, error);
    return `工具执行失败: ${name}`;
  }
}
