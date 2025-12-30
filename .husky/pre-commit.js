import chalk from 'chalk';
import { execSync } from 'child_process';

const messages = [
    "万物皆有可能 🌟",
    "代码如风 💨",
    "Commit 有趣吧 😎",
    "今日事今日毕 🔥",
    "Lint 无压力 🛠️"
];

const msg = messages[Math.floor(Math.random() * messages.length)];

// 执行 lint-staged (包含 prettier 检查)
try {
    execSync('npx lint-staged', { stdio: 'inherit' });
    // 检查通过后打印成功信息
    console.log(chalk.green('\n✅ 代码检查通过！'));
    console.log(chalk.cyan(msg));
} catch (err) {
    console.error(chalk.red('\n❌ Lint-staged 检查未通过，Commit 已阻止 🚫'));
    process.exit(1);
}
