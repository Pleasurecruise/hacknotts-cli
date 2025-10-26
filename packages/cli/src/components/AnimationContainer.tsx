// HackNotts 2025 - Animation Container
// 管理启动和关闭动画的全屏容器

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { LogoAnimation } from './LogoAnimation.js';

interface AnimationContainerProps {
  /**
   * 动画类型：启动或关闭
   */
  type: 'startup' | 'shutdown';
  
  /**
   * 动画完成后的回调
   */
  onComplete: () => void;
  
  /**
   * 关闭动画的结束语（可选）
   */
  goodbyeMessage?: string;
}

/**
 * 动画容器组件
 * 全屏显示启动或关闭动画
 */
export const AnimationContainer: React.FC<AnimationContainerProps> = ({
  type,
  onComplete,
  goodbyeMessage = '👋 Thanks for using HackNotts CLI! See you next time!',
}) => {
  const [showGoodbye, setShowGoodbye] = useState(false);
  
  const isStartup = type === 'startup';
  
  const handleAnimationComplete = () => {
    if (!isStartup) {
      // 关闭动画完成后，先显示结束语
      setShowGoodbye(true);
      // 延迟一下再调用完成回调
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      // 启动动画直接完成
      onComplete();
    }
  };
  
  return (
    <Box 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
      height="100%"
      paddingY={2}
    >
      {!showGoodbye ? (
        <Box flexDirection="column" alignItems="center">
          <LogoAnimation
            speed={15}
            reverse={!isStartup}
            freezeFrames={10}
            onComplete={handleAnimationComplete}
          />
          
          {isStartup && (
            <Box marginTop={2}>
              <Text color="gray" dimColor>
                Loading...
              </Text>
            </Box>
          )}
          
          {!isStartup && (
            <Box marginTop={2}>
              <Text color="yellow">
                Goodbye...
              </Text>
            </Box>
          )}
        </Box>
      ) : (
        <Box flexDirection="column" alignItems="center" paddingY={2}>
          <Text color="green" bold>
            {goodbyeMessage}
          </Text>
          <Box marginTop={1}>
            <Text color="cyan">
              🎉 Happy Hacking! 🎉
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AnimationContainer;
