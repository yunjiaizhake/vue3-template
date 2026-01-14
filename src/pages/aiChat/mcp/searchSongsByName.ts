import type { McpToolConfig } from './types';

/**
 * searchSongsByName 工具 - 根据歌名搜索歌曲
 */
export const searchSongsByNameTool: McpToolConfig = {
  tool: {
    type: 'function',
    function: {
      name: 'searchSongsByName',
      description: '当用户想要搜索特定歌手的歌曲时，必须调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          artist: {
            type: 'string',
            description: '歌手名称',
          },
        },
        required: ['artist'],
      },
    },
  },

  async execute(args) {
    const { artist } = args as { artist: string };

    console.log(`🔧 [searchSongsByName]  歌手: ${artist}}`);

    // 返回格式规范，让模型自己生成内容
    const formatTemplate = `
用户想要搜索歌曲${artist ? `（歌手：${artist}）` : ''}。

请按照以下格式提供歌曲信息：
{
  "name": "歌曲名称",
  "artist": "歌手/艺术家",
  "album": "所属专辑",
  "year": 发行年份(数字),
  "style": "音乐风格",
  "description": "歌曲简介或背景故事"
}

要求：
1. 如果找到匹配的歌曲，详细介绍这首歌的信息
2. 如果有多个同名歌曲，列出最知名的几个版本
3. 可以补充歌曲的创作背景、获奖情况等有趣信息
4. 如果没有找到完全匹配的，可以推荐相似名称或同歌手的其他歌曲
`;

    return formatTemplate;
  },
};
