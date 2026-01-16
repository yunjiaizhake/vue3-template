import type { McpToolConfig } from './types';
import { searchAndPlay } from '@/utils/aiplay';

/**
 * searchSongsByTitle 工具 - 根据歌曲名搜索歌曲
 */
export const searchSongsByTitleTool: McpToolConfig = {
  tool: {
    type: 'function',
    function: {
      name: 'searchSongsByTitle',
      description:
        '当用户想要搜索特定歌曲名、查找某首歌的详细信息时，必须调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '歌曲名称或关键词',
          },
        },
        required: ['title'],
      },
    },
  },

  async execute(args) {
    const { title } = args as { title: string };

    console.log(`🔧 [searchSongsByTitle] 搜索歌曲: ${title}`);
    searchAndPlay(title);

    // 返回格式规范，让模型自己生成内容
    const formatTemplate = `
用户想要搜索歌曲「${title}」的信息。

请按照以下格式提供歌曲信息：
{
  "name": "歌曲名称",
  "artist": "歌手/艺术家",
  "album": "所属专辑",
  "year": 发行年份(数字),
  "style": "音乐风格",
  "lyrics_preview": "经典歌词片段",
  "description": "歌曲简介或创作背景"
}

要求：
1. 提供这首歌的详细信息，包括歌手、专辑、发行年份等
2. 如果有多个同名歌曲，列出最知名的几个版本并说明区别
3. 可以分享歌曲的创作背景、获奖情况、经典歌词等有趣信息
4. 如果找不到完全匹配的歌曲，推荐名称相似的歌曲
`;

    return formatTemplate;
  },
};
