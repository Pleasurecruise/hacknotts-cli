#!/usr/bin/env node
// 详细测试 - 展示动画的多个关键帧

import {
  getAnimationFrameString,
  getTotalSteps,
} from './ui/LogoAnimation.js';

console.log('🎬 Logo 动画详细演示\n');
console.log(`总步数: ${getTotalSteps()}\n`);

// 显示更多关键帧
const keyFrames = [0, 1, 5, 10, 20, 40, 60, 81];

keyFrames.forEach((step, index) => {
  console.log('='.repeat(100));
  console.log(`\n📍 第 ${step} 帧:`);
  
  if (step === 0) {
    console.log('   (只显示最后16个字符)');
  } else if (step === 1) {
    console.log('   (第1个字符 + 最后16个字符)');
  } else if (step < 81) {
    console.log(`   (前${step}个字符 + 最后16个字符)`);
  } else {
    console.log('   (完整显示)');
  }
  
  console.log();
  console.log('\x1b[36m' + getAnimationFrameString(step) + '\x1b[0m');
});

console.log('='.repeat(100));
console.log('\n✅ 动画原理：');
console.log('   1. 开始：只显示最后16个字符');
console.log('   2. 逐步：从左边一个字符一个字符地添加');
console.log('   3. 右边：始终保持最后16个字符可见');
console.log('   4. 结束：两边连接，显示完整logo\n');
