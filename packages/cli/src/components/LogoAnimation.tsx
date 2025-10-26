// HackNotts 2025 - Logo Animation Demo Component
// 展示基于 shadowedAsciiLogo 的动画效果

import { Box } from 'ink';
import React, { useEffect, useState } from 'react';

import {
  getAnimationFrameString,
  getTotalSteps,
} from '../ui/LogoAnimation.js';
import AnimatedGradient from './AnimatedGradient.js';

interface LogoAnimationProps {
  /**
   * 动画速度（毫秒/帧）
   * @default 50
   */
  speed?: number;
  
  /**
   * 动画完成后的回调
   */
  onComplete?: () => void;
  
  /**
   * 是否循环播放
   * @default false
   */
  loop?: boolean;
  
  /**
   * 是否反向播放
   * @default false
   */
  reverse?: boolean;
  
  /**
   * 开始和结束的冻结帧数
   * @default 10
   */
  freezeFrames?: number;
}

/**
 * Logo 动画组件
 * 先显示最后16个字符，然后逐步从右往左补充完整 logo
 */
export const LogoAnimation: React.FC<LogoAnimationProps> = ({
  speed = 50,
  onComplete,
  loop = false,
  reverse = false,
  freezeFrames = 10,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const totalSteps = getTotalSteps(freezeFrames);

  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // 动画完成
        if (loop) {
          setCurrentStep(0); // 循环播放
        } else {
          setIsAnimating(false);
          onComplete?.();
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [currentStep, totalSteps, speed, isAnimating, loop, onComplete]);

  const currentFrame = getAnimationFrameString(currentStep, reverse, freezeFrames);

  return (
    <Box flexDirection="column">
      <AnimatedGradient>
        {currentFrame}
      </AnimatedGradient>
    </Box>
  );
};

export default LogoAnimation;
