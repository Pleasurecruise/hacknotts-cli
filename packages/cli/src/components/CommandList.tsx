import { Box, Text } from 'ink'
import { memo, useState, useEffect, useMemo } from 'react'
import type { Command } from '../commands/types'

type CommandListProps = {
  commands: Command[]
  onClose: () => void
  selectedIndex?: number
  searchQuery?: string
  scrollOffset?: number
}

export const CommandList = memo(({ 
  commands, 
  selectedIndex = 0, 
  searchQuery = '',
  scrollOffset = 0
}: CommandListProps) => {
  const [boxHeight, setBoxHeight] = useState(8)
  
  // 监听终端尺寸变化
  useEffect(() => {
    const updateHeight = () => {
      const terminalHeight = process.stdout.rows || 24
      // 预留顶部标题、底部提示和输入框的空间
      const availableHeight = terminalHeight - 12
      setBoxHeight(Math.max(5, Math.min(availableHeight, 15)))
    }

    process.stdout.on('resize', updateHeight)
    updateHeight()

    return () => {
      process.stdout.off('resize', updateHeight)
    }
  }, [])

  // 计算可见的命令
  const { visibleCommands, canScrollUp, canScrollDown, scrollPercentage } = useMemo(() => {
    if (commands.length === 0) {
      return {
        visibleCommands: [],
        canScrollUp: false,
        canScrollDown: false,
        scrollPercentage: 0
      }
    }

    const visible = commands.slice(scrollOffset, scrollOffset + boxHeight)
    const canUp = scrollOffset > 0
    const canDown = scrollOffset + boxHeight < commands.length
    const percentage = commands.length <= boxHeight 
      ? 100 
      : Math.round((scrollOffset / Math.max(1, commands.length - boxHeight)) * 100)

    return {
      visibleCommands: visible,
      canScrollUp: canUp,
      canScrollDown: canDown,
      scrollPercentage: percentage
    }
  }, [commands, scrollOffset, boxHeight])

  if (commands.length === 0) {
    return (
      <Box 
        flexDirection="column" 
        borderStyle="round" 
        borderColor="yellow"
        paddingX={1}
        paddingY={0}
      >
        <Box>
          <Text bold color="yellow">📋 Available Commands</Text>
        </Box>
        <Box>
          <Text color="gray" dimColor>No matching commands found</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box 
      flexDirection="column" 
      borderStyle="round" 
      borderColor="yellow"
      paddingX={1}
      paddingY={0}
    >
      <Box>
        <Text bold color="yellow">📋 Available Commands</Text>
        {searchQuery && (
          <Text color="gray" dimColor> (searching: "{searchQuery}")</Text>
        )}
      </Box>
      
      <Box flexDirection="column" borderStyle="single" borderColor="cyan">
        {visibleCommands.map((command, index) => {
          const actualIndex = scrollOffset + index
          const isSelected = actualIndex === selectedIndex
          
          return (
            <Box key={command.name} flexDirection="column">
              <Box>
                {isSelected && <Text color="green">▶ </Text>}
                {!isSelected && <Text>  </Text>}
                <Text 
                  color={isSelected ? "green" : "cyan"} 
                  bold={isSelected}
                  inverse={isSelected}
                >
                  /{command.name}
                </Text>
                {command.aliases && command.aliases.length > 0 && (
                  <Text color="gray" dimColor> (aliases: {command.aliases.map(a => `/${a}`).join(', ')})</Text>
                )}
              </Box>
              <Box paddingLeft={3}>
                <Text color={isSelected ? "white" : "gray"}>{command.description}</Text>
              </Box>
            </Box>
          )
        })}
        
        {/* 滚动条指示器 */}
        {commands.length > boxHeight && (
          <Box>
            <Text color="yellow" backgroundColor="black">
              {canScrollUp ? '▲ ' : '  '}Scroll [{String(scrollPercentage).padStart(3, ' ')}%]{canScrollDown ? ' ▼' : '  '}
            </Text>
          </Box>
        )}
      </Box>
      
      <Box>
        <Text color="gray" dimColor>
          💡 ↑↓ View | Tab Complete | Enter Execute {commands.length > boxHeight && '| PgUp/PgDn Change Page'}
        </Text>
      </Box>
      
      {commands.length > boxHeight && (
        <Box>
          <Text color="cyan" dimColor>
            Display: {scrollOffset + 1}-{Math.min(scrollOffset + boxHeight, commands.length)} / {commands.length}
          </Text>
        </Box>
      )}
    </Box>
  )
})

CommandList.displayName = 'CommandList'

export default CommandList
