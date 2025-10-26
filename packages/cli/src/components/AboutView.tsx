import { readFileSync } from 'node:fs'
import {resolve } from 'node:path'

import { Box, Text, useInput } from 'ink'
import { memo,useState } from 'react'

import { shadowedAsciiLogo } from '../ui/AsciiArt'
import AnimatedGradient from './AnimatedGradient'

type AboutViewProps = {
  onClose: () => void
}

// 获取 package.json 信息
const getPackageInfo = () => {
  try {
    // 从编译后的 dist 目录向上查找 package.json
    const packagePath = resolve(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
    return {
      version: packageJson.version || '1.0.0',
      author: packageJson.author || 'Pleasurecruise, IvanHanloth',
      repository: packageJson.repository?.url?.replace('git+', '').replace('.git', '') || 
                  'https://github.com/Pleasurecruise/hacknotts-cli',
      license: packageJson.license || 'MIT'
    }
  } catch (error) {
    // 如果读取失败，返回默认值
    return {
      version: '1.0.0',
      author: 'Pleasurecruise, IvanHanloth',
      repository: 'https://github.com/Pleasurecruise/hacknotts-cli',
      license: 'MIT'
    }
  }
}

export const AboutView = memo(({ onClose }: AboutViewProps) => {
  const [packageInfo] = useState(() => getPackageInfo())
  const [buildTime] = useState(() => {
    // 使用当前日期
    return new Date().toISOString().split('T')[0]
  })

  // 处理键盘输入
  useInput((input, key) => {
    if (key.escape || input === 'q' || input === 'Q') {
      onClose()
    }
  })


  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      paddingX={2}
    >
      {/* Logo区域 - 居中显示并带颜色变化 */}
      <Box flexDirection="column" alignItems="center">
        <AnimatedGradient speed={500}>
          {shadowedAsciiLogo}
        </AnimatedGradient>
      </Box>

      {/* 信息区域 - 居中显示 */}
      <Box flexDirection="column" alignItems="center" marginTop={1} marginBottom={1}>
        <Text bold color="cyan">
          ═══════════════════════════════════════════════════════════════
        </Text>
        
        <Box marginTop={1} marginBottom={1}>
          <Text>
            <Text bold color="green">🎉 HackNotts 2025 AI CLI 🎉</Text>
          </Text>
        </Box>

        <Box flexDirection="column" alignItems="center">
          <Text>
            <Text color="yellow">Version: </Text>
            <Text color="white">{packageInfo.version}</Text>
          </Text>
          
          <Text>
            <Text color="yellow">Developers: </Text>
            <Text color="white">{packageInfo.author}</Text>
          </Text>
          
          <Text>
            <Text color="yellow">Build Time: </Text>
            <Text color="white">{buildTime}</Text>
          </Text>
          
          <Text>
            <Text color="yellow">License: </Text>
            <Text color="white">{packageInfo.license}</Text>
          </Text>
          
          <Text>
            <Text color="yellow">Repository: </Text>
            <Text color="cyan">{packageInfo.repository}</Text>
          </Text>

          <Text>
            <Text color="yellow">HackNotts Website: </Text>
            <Text color="cyan">https://hacknotts.com/</Text>
          </Text>
        </Box>

        <Box marginTop={1} marginBottom={1}>
          <Text color="magenta" italic>
            💡 HackNotts is an annual hackathon held by HackSoc at the University of Nottingham. 
          </Text>
        </Box>

        <Text bold color="cyan">
          ═══════════════════════════════════════════════════════════════
        </Text>
      </Box>

      {/* 底部提示 */}
      <Box marginTop={1}>
        <Text dimColor>
          Press <Text bold color="yellow">Esc</Text> or <Text bold color="yellow">q</Text> to return
        </Text>
      </Box>
    </Box>
  )
})

AboutView.displayName = 'AboutView'
