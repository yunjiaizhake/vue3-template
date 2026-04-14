/**
 * 将本地图片文件转为 base64 data URL，大模型可直接识别该格式
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

const URL_RE = /https?:\/\/\S+/i;

/**
 * 判断文本是否为 http(s):// 开头的 URL
 */
export function isImageUrl(text: string): boolean {
  const trimmed = text.trim();
  return /^https?:\/\/\S+$/i.test(trimmed);
}

/**
 * 从用户输入中提取图片 URL 和剩余文本
 */
export function extractImageAndText(input: string): {
  imageUrl: string | null;
  text: string;
} {
  const match = input.match(URL_RE);
  if (!match) {
    return { imageUrl: null, text: input.trim() };
  }

  const imageUrl = match[0];
  const text = input.replace(imageUrl, '').trim();
  return { imageUrl, text };
}

/**
 * 判断文件是否为图片
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
