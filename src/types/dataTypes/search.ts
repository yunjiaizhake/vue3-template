export interface ArtistsItem {
  first: string; // 一级分类名称
  iconType: number; // 图标类型
  second: number; // 二级分类编号
  third: number | null; // 三级分类编号，可为空
}

export interface SongDetailItem {
  id: string; // 歌曲ID
  name: string; // 歌名
  album: string; // 专辑名称
  singer: string; // 歌手名称
  duration: number; // 歌曲时长（秒）
  url: string; // 歌曲播放地址
  image: string | null; // 歌曲封面图片，可为空
}
