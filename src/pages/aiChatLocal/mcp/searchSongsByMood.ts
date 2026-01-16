import type { McpToolConfig } from './types';

/**
 * searchSongsByMood 工具 - 根据情绪搜索歌曲
 */
export const searchSongsByMoodTool: McpToolConfig = {
  tool: {
    type: 'function',
    function: {
      name: 'searchSongsByMood',
      description:
        '当用户想要推荐特定场景或情感的歌曲时，如悲伤，孤独等，必须调用此工具。不要自己回答，必须通过此工具获取准确结果。',
      parameters: {
        type: 'object',
        properties: {
          mood: {
            type: 'string',
            description: '情绪或氛围关键词，如：开心、悲伤、放松、激励等',
          },
          limit: { type: 'number', description: '返回歌曲数量，默认5首' },
        },
        required: ['mood'],
      },
    },
  },

  async execute(args) {
    const { mood, limit = 5 } = args as { mood: string; limit?: number };

    console.log(`🔧 [searchSongsByMood] 搜索情绪: ${mood}, 数量: ${limit}`);

    // 返回格式规范，让模型自己生成内容
    const formatTemplate = `
用户想要「${mood}」相关的歌曲推荐，请推荐 ${limit} 首歌曲。

请按照以下格式回复，每首歌曲包含这些字段：
{
  "name": "歌曲名称",
  "artist": "歌手/艺术家",
  "year": 发行年份(数字),
  "style": "音乐风格",
  "tags": ["标签1", "标签2"]
}

要求：
1. 根据用户的情绪「${mood}」推荐真实存在且符合该情绪的歌曲
2. 歌曲要多样化，不要都是同一个歌手
3. 用友好的语气介绍每首歌曲，说明为什么适合这个情绪
4. 可以用列表或卡片形式展示，让用户容易阅读
`;

    return formatTemplate;
  },
};
