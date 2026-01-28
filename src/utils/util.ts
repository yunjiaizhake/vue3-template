import type { LyricLine } from '@/types/dataTypes';

// 随机排序数组/洗牌函数 https://github.com/lodash/lodash/blob/master/shuffle.js
function copyArray(source: any[], array: any[] | undefined = undefined) {
  let index = -1;
  const length = source.length;
  array || (array = new Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

export const randomSortArray = function shuffle(array) {
  const length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  let index = -1;
  const lastIndex = length - 1;
  const result = copyArray(array);
  while (++index < length) {
    const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
    const value = result[rand];
    result[rand] = result[index];
    result[index] = value;
  }
  return result;
};

// 防抖函数
export function debounce(func, delay) {
  let timer;
  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// 补0函数
export function addZero(s: number) {
  return s < 10 ? '0' + s : s;
}

// 歌词解析
const timeExp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]/g;
export function parseLyric(lrc: string): LyricLine[] {
  const lines: string[] = lrc.split('\n');
  const lyric: LyricLine[] = [];
  for (const line of lines) {
    const result = timeExp.exec(line);
    if (!result) {
      continue;
    }
    const text = line.replace(timeExp, '').trim();
    if (text) {
      lyric.push({
        time:
          (Number(result[1]) * 6e4 +
            Number(result[2]) * 1e3 +
            Number(result[3] || 0)) /
          1e3,
        text,
      });
    }
  }
  return lyric;
}

// 时间格式化
export function format(value) {
  let minute = Math.floor(value / 60);
  let second = Math.floor(value % 60);
  return `${addZero(minute)}:${addZero(second)}`;
}

export function isPromise(v) {
  return v !== undefined && v !== null && typeof v.then === 'function';
}

export function silencePromise(value) {
  if (isPromise(value)) {
    value.then(null, () => {});
  }
}

// 判断 string 类型
export function isString(v) {
  return typeof v === 'string';
}

// http 链接转化成 https
export function toHttps(url) {
  if (!isString(url)) {
    return url;
  }
  return url.replace('http://', 'https://');
}

// 格式化评论时间
export function formatTime(time) {
  let formatTime;
  const date = new Date(time);
  const dateObj = {
    year: date.getFullYear(),
    month: date.getMonth(),
    date: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
  };
  const newTime = new Date();
  const diff = newTime.getTime() - time;

  if (newTime.getDate() === dateObj.date && diff < 60000) {
    formatTime = '刚刚';
  } else if (newTime.getDate() === dateObj.date && diff < 3600000) {
    formatTime = `${Math.floor(diff / 60000)}分钟前`;
  } else if (newTime.getDate() === dateObj.date && diff < 86400000) {
    formatTime = `${addZero(dateObj.hours)}:${addZero(dateObj.minutes)}`;
  } else if (newTime.getDate() !== dateObj.date && diff < 86400000) {
    formatTime = `昨天${addZero(dateObj.hours)}:${addZero(dateObj.minutes)}`;
  } else if (newTime.getFullYear() === dateObj.year) {
    formatTime = `${dateObj.month + 1}月${dateObj.date}日`;
  } else {
    formatTime = `${dateObj.year}年${dateObj.month + 1}月${dateObj.date}日`;
  }
  return formatTime;
}

export function printLog() {
  console.log(String.raw`
 _       ___     _   _    ___    _   _    ____    ____    ___  
| |     |_ _|   | | | |  / _ \  | \ | |  / ___|  | __ )  / _ \ 
| |      | |    | |_| | | | | | |  \| | | |  _   |  _ \ | | | |
| |___   | |    |  _  | | |_| | | |\  | | |_| |  | |_)  | |_| |
|_____| |___|   |_| |_|  \___/  |_| \_|  \____|  |____/  \___/ 
                                                                                                                                                                                                                
  `);
}