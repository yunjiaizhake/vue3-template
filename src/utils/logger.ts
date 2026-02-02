// 浏览器前端适用，打印在浏览器中
// 浏览器 CSS 颜色样式
const styles = {
    debug: 'color:#00bcd4;font-weight:bold;',
    info: 'color:#4caf50;font-weight:bold;',
    warn: 'color:#ff9800;font-weight:bold;',
    error: 'color:#f44336;font-weight:bold;',
    // success: 'color:#2e7d32;font-weight:bold;',
    // critical:
    //     'color:white;background:#d32f2f;font-weight:bold;padding:2px 4px;border-radius:2px;',
}

// 核心输出函数
function print(type: keyof typeof styles, label: string, msg: string, args: unknown[]) {
    console[type](`%c${label}`, styles[type], msg, ...args)
}

const logger = {
    debug: (msg: string, ...args: unknown[]) =>
        print('debug', '[DEBUG]', msg, args),

    info: (msg: string, ...args: unknown[]) =>
        print('info', '[INFO]', msg, args),

    warn: (msg: string, ...args: unknown[]) =>
        print('warn', '[WARN]', msg, args),

    error: (msg: string, ...args: unknown[]) =>
        print('error', '[ERROR]', msg, args),

    success: (msg: string, ...args: unknown[]) =>
        print('info', '[SUCCESS]', msg, args),

    critical: (msg: string, ...args: unknown[]) =>
        print('error', '[CRITICAL]', msg, args),
}

declare global {
    interface Window {
        logger: typeof logger
    }
}

// 浏览器环境直接挂全局（可选）
window.logger = logger

export {}