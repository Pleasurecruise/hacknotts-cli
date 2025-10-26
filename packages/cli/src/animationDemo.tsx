#!/usr/bin/env node
// HackNotts 2025 - Logo Animation Demo
// 演示如何使用 Logo 动画功能

import React from 'react';
import { render } from 'ink';
import { LogoAnimation } from './components/LogoAnimation.js';

/**
 * 动画演示应用
 */
const AnimationDemo = () => {
  return (
    <LogoAnimation
      speed={30}  // 30ms 每帧，可以调整速度
      onComplete={() => {
        console.log('\n🎉 动画播放完成！');
        process.exit(0);
      }}
    />
  );
};

// 渲染动画
render(<AnimationDemo />);
