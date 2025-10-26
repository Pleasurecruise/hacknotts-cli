import { Box, Text, useInput } from 'ink'
import { memo, type ReactElement,useEffect, useMemo, useState } from 'react'

import type { Command } from '../commands/types'

type HelpViewProps = {
  commands: Command[]
  onClose: () => void
}

// 快捷键配置 - 仅显示Help视图中使用的快捷键
const KEYBOARD_SHORTCUTS = [
  { key: '↑ ↓', description: 'Scroll up/down' },
  { key: 'PgUp/PgDn', description: 'Page up/down' },
  { key: 'Esc / q', description: 'Close help view' },
]

export const HelpView = memo(({ commands, onClose }: HelpViewProps) => {
  const [scrollOffset, setScrollOffset] = useState(0)
  const [contentHeight, setContentHeight] = useState(10)
  
  // 监听终端尺寸变化
  useEffect(() => {
    const updateHeight = () => {
      const terminalHeight = process.stdout.rows || 24
      // 预留顶部标题、底部快捷键区域和边距
      const availableHeight = terminalHeight - 12
      setContentHeight(Math.max(8, availableHeight))
    }

    process.stdout.on('resize', updateHeight)
    updateHeight()

    return () => {
      process.stdout.off('resize', updateHeight)
    }
  }, [])

  // 计算内容总行数
  const totalContentLines = useMemo(() => {
    // 每个命令占用的行数：命令行 + 别名行（如果有）+ 描述行 + 空行 = 3-4行
    return commands.reduce((total, cmd) => {
      return total + (cmd.aliases && cmd.aliases.length > 0 ? 4 : 3)
    }, 0)
  }, [commands])

  // 计算可见内容
  const { visibleContent, canScrollUp, canScrollDown, scrollPercentage } = useMemo(() => {
    const maxScroll = Math.max(0, totalContentLines - contentHeight)
    const actualOffset = Math.min(scrollOffset, maxScroll)
    
    const canUp = actualOffset > 0
    const canDown = actualOffset < maxScroll
    const percentage = maxScroll === 0 ? 100 : Math.round((actualOffset / maxScroll) * 100)

    return {
      visibleContent: { offset: actualOffset, height: contentHeight },
      canScrollUp: canUp,
      canScrollDown: canDown,
      scrollPercentage: percentage
    }
  }, [scrollOffset, contentHeight, totalContentLines])

  // 处理键盘输入
  useInput((input, key) => {
    // Esc 或 q 关闭帮助
    if (key.escape || input === 'q' || input === 'Q') {
      onClose()
      return
    }

    // 上下方向键滚动
    if (key.upArrow) {
      setScrollOffset(prev => Math.max(0, prev - 1))
      return
    }

    if (key.downArrow) {
      setScrollOffset(prev => Math.min(totalContentLines - contentHeight, prev + 1))
      return
    }

    // Page Up/Down 翻页
    if (key.pageUp) {
      setScrollOffset(prev => Math.max(0, prev - Math.floor(contentHeight * 0.8)))
      return
    }

    if (key.pageDown) {
      setScrollOffset(prev => Math.min(totalContentLines - contentHeight, prev + Math.floor(contentHeight * 0.8)))
      return
    }

    // Home/End (使用快捷键组合)
    if (key.meta && input === 'h') {
      setScrollOffset(0)
      return
    }

    if (key.meta && input === 'e') {
      setScrollOffset(Math.max(0, totalContentLines - contentHeight))
      return
    }
  })

  // 渲染命令内容（带滚动）
  const renderCommandContent = () => {
    let currentLine = 0
    const result: ReactElement[] = []

    for (const command of commands) {
      const commandLines: ReactElement[] = []
      
      // 命令名称行
      commandLines.push(
        <Box key={`${command.name}-title`} marginTop={currentLine === 0 ? 0 : 1}>
          <Text bold color="cyan">/{command.name}</Text>
        </Box>
      )
      currentLine++

      // 别名行（如果有）
      if (command.aliases && command.aliases.length > 0) {
        commandLines.push(
          <Box key={`${command.name}-aliases`} paddingLeft={2}>
            <Text color="gray">Aliases: </Text>
            <Text color="yellow">{command.aliases.map(a => `/${a}`).join(', ')}</Text>
          </Box>
        )
        currentLine++
      }

      // 描述行
      commandLines.push(
        <Box key={`${command.name}-desc`} paddingLeft={2}>
          <Text>{command.description}</Text>
        </Box>
      )
      currentLine++

      // 检查是否在可见范围内
      const commandStartLine = currentLine - commandLines.length
      const commandEndLine = currentLine
      
      if (commandEndLine > visibleContent.offset && 
          commandStartLine < visibleContent.offset + visibleContent.height) {
        result.push(...commandLines)
      }

      // 如果已经超出可见范围，可以提前退出
      if (commandStartLine > visibleContent.offset + visibleContent.height) {
        break
      }
    }

    return result
  }

  return (
    <Box flexDirection="column" width="100%">
      {/* 主内容区域 */}
      <Box 
        flexDirection="column" 
        borderStyle="round" 
        borderColor="cyan"
        paddingX={1}
        paddingY={0}
      >
        {/* 标题 */}
        <Box marginBottom={1}>
          <Text bold color="cyan">📖 Help - Available Commands</Text>
          <Text color="gray" dimColor> ({commands.length} commands)</Text>
        </Box>

        {/* 滚动内容区域 */}
        <Box 
          flexDirection="column" 
          borderStyle="single" 
          borderColor="gray"
          height={contentHeight}
          paddingX={1}
        >
          {renderCommandContent()}
        </Box>

        {/* 滚动指示器 */}
        {totalContentLines > contentHeight && (
          <Box justifyContent="center" marginTop={1}>
            <Text color="yellow">
              {canScrollUp ? '▲ ' : '  '}
              Scroll [{String(scrollPercentage).padStart(3, ' ')}%] 
              {canScrollDown ? ' ▼' : '  '}
              {' '}| Line {visibleContent.offset + 1}-{Math.min(visibleContent.offset + contentHeight, totalContentLines)}/{totalContentLines}
            </Text>
          </Box>
        )}
      </Box>

      {/* 快捷键区域 */}
      <Box 
        flexDirection="column" 
        borderStyle="round" 
        borderColor="magenta"
        paddingX={1}
        paddingY={0}
        marginTop={1}
      >
        <Box>
          <Text bold color="magenta">⌨️  Keyboard Shortcuts</Text>
        </Box>
        
        <Box flexDirection="column" paddingLeft={1}>
          {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
            <Box key={index}>
              <Text color="yellow" bold>{shortcut.key.padEnd(12)}</Text>
              <Text color="white">{shortcut.description}</Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            💡 Press Esc or q to close this help view
          </Text>
        </Box>
      </Box>
    </Box>
  )
})

HelpView.displayName = 'HelpView'

export default HelpView
