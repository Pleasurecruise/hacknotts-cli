#!/usr/bin/env node
// HackNotts 2025 - Simple Logo Animation Demo (No React)
// 纯 TypeScript 版本的动画演示

import {
  getAnimationFrameString,
  getTotalSteps,
} from './ui/LogoAnimation.js';

/**
 * 清屏并移动光标到顶部
 */
const clearScreen = () => {
  process.stdout.write('\x1Bc'); // 清屏
};

/**
 * 移动光标到起始位置
 */
const moveCursorToTop = () => {
  process.stdout.write('\x1B[H'); // 移动到顶部
};

/**
 * 播放动画
 */
async function playAnimation(reverse: boolean = false, freezeFrames: number = 10) {
  const totalSteps = getTotalSteps(freezeFrames);
  const speed = 20; // 毫秒/帧
  
  clearScreen();
  console.log(`\n🎬 Logo 动画${reverse ? '（反向）' : ''}开始...\n`);
  console.log(`冻结帧: ${freezeFrames} 帧（开始）+ ${freezeFrames} 帧（结束）\n`);
  
  for (let step = 0; step < totalSteps; step++) {
    moveCursorToTop();
    
    const frame = getAnimationFrameString(step, reverse, freezeFrames);
    const color = reverse ? '\x1b[35m' : '\x1b[36m'; // 反向用紫色，正向用青色
    console.log('\n' + color + frame + '\x1b[0m');
    
    // 显示进度和状态
    const progress = ((step + 1) / totalSteps * 100).toFixed(1);
    let status = '';
    if (step < freezeFrames) {
      status = '开始冻结帧';
    } else if (step >= totalSteps - freezeFrames) {
      status = '结束冻结帧';
    } else {
      status = '动画中';
    }
    
    console.log(`\n📊 进度: ${progress}% (${step + 1}/${totalSteps}) | 状态: ${status}`);
    console.log(`🔄 模式: ${reverse ? '反向播放' : '正向播放'}`);
    
    // 等待下一帧
    await new Promise(resolve => setTimeout(resolve, speed));
  }
  
  console.log('\n\n✨ 动画播放完成！\n');
}

// 解析命令行参数
const args = process.argv.slice(2);
const reverse = args.includes('--reverse') || args.includes('-r');
const freezeArg = args.find(arg => arg.startsWith('--freeze='));
const freezeFrames = freezeArg ? parseInt(freezeArg.split('=')[1]) : 10;

console.log('\n使用方法:');
console.log('  正向: npx tsx packages/cli/src/simpleAnimationDemo.ts');
console.log('  反向: npx tsx packages/cli/src/simpleAnimationDemo.ts --reverse');
console.log('  自定义冻结帧: npx tsx packages/cli/src/simpleAnimationDemo.ts --freeze=20\n');

// 运行动画
playAnimation(reverse, freezeFrames).catch(error => {
  console.error('❌ 动画播放出错:', error);
  process.exit(1);
});
