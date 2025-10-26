// HackNotts 2025 - Logo Animation Module
// 基于 shadowedAsciiLogo 的动画效果

/**
 * shadowedAsciiLogo 分行数组
 * 每个元素代表 logo 的一行
 */
export const shadowedLogoLines = [
  "██╗  ██╗ █████╗  ██████╗██╗  ██╗███╗   ██╗ ██████╗ ████████╗████████╗███████╗    ██████╗ ███████╗",
  "██║  ██║██╔══██╗██╔════╝██║ ██╔╝████╗  ██║██╔═══██╗╚══██╔══╝╚══██╔══╝██╔════╝    ╚════██╗██╔════╝",
  "███████║███████║██║     █████╔╝ ██╔██╗ ██║██║   ██║   ██║      ██║   ███████╗     █████╔╝███████╗",
  "██╔══██║██╔══██║██║     ██╔═██╗ ██║╚██╗██║██║   ██║   ██║      ██║   ╚════██║    ██╔═══╝ ╚════██║",
  "██║  ██║██║  ██║╚██████╗██║  ██╗██║ ╚████║╚██████╔╝   ██║      ██║   ███████║    ███████╗███████║",
  "╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝    ╚═╝      ╚═╝   ╚══════╝    ╚══════╝╚══════╝",
];

/**
 * 获取动画帧
 * @param step 当前步骤
 * @param reverse 是否反向播放
 * @param freezeFrames 开始和结束的冻结帧数
 * @returns 当前步骤的 logo 字符串数组
 */
export const getAnimationFrame = (step: number, reverse: boolean = false, freezeFrames: number = 10): string[] => {
  const LAST_CHARS = 16; // 最后16个字符（最后两个字母 "25"）
  const totalStepsWithoutFreeze = getTotalStepsWithoutFreeze();
  
  // 处理反向播放
  let actualStep = reverse ? (totalStepsWithoutFreeze - 1 - (step - freezeFrames)) : (step - freezeFrames);
  
  // 处理冻结帧
  if (step < freezeFrames) {
    // 开始冻结帧
    actualStep = reverse ? (totalStepsWithoutFreeze - 1) : 0;
  } else if (step >= freezeFrames + totalStepsWithoutFreeze) {
    // 结束冻结帧
    actualStep = reverse ? 0 : (totalStepsWithoutFreeze - 1);
  }
  
  // 确保 actualStep 在有效范围内
  actualStep = Math.max(0, Math.min(actualStep, totalStepsWithoutFreeze - 1));
  
  return shadowedLogoLines.map(line => {
    const totalLength = line.length;
    const centerPosition = Math.floor((totalLength - LAST_CHARS) / 2); // 居中位置
    
    if (actualStep <= centerPosition) {
      // 阶段1：最后16个字符居中，然后逐渐向左移动
      // actualStep 0: 完全居中
      // actualStep 1-centerPosition: 逐步减少前面的空格
      const spacesCount = centerPosition - actualStep;
      const spaces = ' '.repeat(spacesCount);
      return spaces + line.slice(-LAST_CHARS);
    } else {
      // 阶段2：从左边开始添加字符
      const frontChars = actualStep - centerPosition;
      
      if (frontChars >= totalLength - LAST_CHARS) {
        // 已经连接上了，显示完整内容
        return line;
      } else {
        // 还没连接：前面的字符 + 最后16个字符
        const front = line.slice(0, frontChars);
        const back = line.slice(-LAST_CHARS);
        return front + back;
      }
    }
  });
};

/**
 * 获取不包含冻结帧的总动画步数
 * @returns 动画总步数（不含冻结帧）
 */
export const getTotalStepsWithoutFreeze = (): number => {
  const maxLineLength = Math.max(...shadowedLogoLines.map(line => line.length));
  const LAST_CHARS = 16;
  const centerPosition = Math.floor((maxLineLength - LAST_CHARS) / 2);
  
  // 总步数 = 居中到左边的步数 + 添加前面字符的步数 + 1
  return centerPosition + (maxLineLength - LAST_CHARS) + 1;
};

/**
 * 获取总动画步数（包含冻结帧）
 * @param freezeFrames 开始和结束的冻结帧数
 * @returns 动画总步数
 */
export const getTotalSteps = (freezeFrames: number = 10): number => {
  const coreSteps = getTotalStepsWithoutFreeze();
  // 总步数 = 开始冻结帧 + 核心动画步数 + 结束冻结帧
  return freezeFrames + coreSteps + freezeFrames;
};

/**
 * 将字符串数组转换为单个字符串
 * @param lines 字符串数组
 * @returns 合并后的字符串
 */
export const framesToString = (lines: string[]): string => {
  return lines.join('\n') + '\n';
};

/**
 * 生成完整的动画序列
 * @param reverse 是否反向播放
 * @param freezeFrames 开始和结束的冻结帧数
 * @returns 所有动画帧的数组
 */
export const generateAnimationSequence = (reverse: boolean = false, freezeFrames: number = 10): string[] => {
  const totalSteps = getTotalSteps(freezeFrames);
  const frames: string[] = [];
  
  for (let step = 0; step < totalSteps; step++) {
    const frame = getAnimationFrame(step, reverse, freezeFrames);
    frames.push(framesToString(frame));
  }
  
  return frames;
};

/**
 * 获取动画帧（简化版本，直接返回字符串）
 * @param step 当前步骤
 * @param reverse 是否反向播放
 * @param freezeFrames 开始和结束的冻结帧数
 * @returns 当前帧的完整字符串
 */
export const getAnimationFrameString = (step: number, reverse: boolean = false, freezeFrames: number = 10): string => {
  const frame = getAnimationFrame(step, reverse, freezeFrames);
  return framesToString(frame);
};
