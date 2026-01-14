import type { McpToolConfig } from './types';

/**
 * searchSongsByLyrics 工具 - 根据歌词片段搜索歌曲
 */
export const searchSongsByLyricsTool: McpToolConfig = {
  tool: {
    type: 'function',
    function: {
      name: 'searchSongsByLyrics',
      description: '当用户提供一段歌词、想通过歌词找歌曲时，必须调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          lyrics: {
            type: 'string',
            description: '用户提供的歌词片段或关键词',
          },
        },
        required: ['lyrics'],
      },
    },
  },

  async execute(args) {
    const { lyrics } = args as { lyrics: string };

    console.log(`🔧 [searchSongsByLyrics] 搜索歌词: ${lyrics}`);

    // 返回格式规范，让模型自己生成内容
    const formatTemplate = `
用户想通过歌词「${lyrics}」来查找歌曲。

请按照以下格式提供匹配的歌曲信息：
{
  "name": "歌曲名称",
  "artist": "歌手/艺术家",
  "album": "所属专辑",
  "year": 发行年份(数字),
  "matched_lyrics": "包含该歌词的完整歌词段落",
  "context": "这段歌词在歌曲中的位置（如：副歌、开头、结尾等）"
}

要求：
1. 根据提供的歌词片段，找出最可能匹配的歌曲
2. 如果有多首歌曲包含相似歌词，列出最知名的几首
3. 提供该歌词的上下文，帮助用户确认是否是他要找的歌
4. 可以分享这首歌或这段歌词的创作故事、含义等有趣信息
5. 如果无法确定具体歌曲，给出最可能的几个选项让用户选择
`;

    return formatTemplate;
  },
};
