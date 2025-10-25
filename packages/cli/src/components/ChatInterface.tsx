import { Box, Text, useInput } from 'ink'
import type { Key } from 'ink'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import type { CommandRegistry } from '../commands'
import CommandList from './CommandList'
import { getRandomAsciiLogo } from '../ui/AsciiArt'

export type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

type ChatInterfaceProps = {
  onSendMessage: (message: string) => void
  messages: Message[]
  isLoading?: boolean
  commandRegistry?: CommandRegistry
}

// 提取 MessageItem 组件并使用 memo 优化
const MessageItem = memo(({ message }: { message: Message }) => {
  let displayName = '🤖 AI'
  let color: 'cyan' | 'green' | 'yellow' = 'green'
  
  if (message.role === 'user') {
    displayName = '👤 You'
    color = 'cyan'
  } else if (message.role === 'system') {
    displayName = '⚙️  System'
    color = 'yellow'
  }
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color={color}>
          {displayName}
        </Text>
        <Text color="gray" dimColor> • {message.timestamp.toLocaleTimeString()}</Text>
      </Box>
      <Box paddingLeft={2}>
        <Text wrap="wrap">
          {message.content}
          {message.isStreaming && <Text color="gray">▋</Text>}
        </Text>
      </Box>
    </Box>
  )
})

MessageItem.displayName = 'MessageItem'

export const ChatInterface = ({ onSendMessage, messages, isLoading = false, commandRegistry }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showCommandList, setShowCommandList] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [filteredCommands, setFilteredCommands] = useState<any[]>([])
  
  // 随机选择一个 ASCII 字符画，只在组件首次加载时选择一次
  const randomAsciiLogo = useMemo(() => getRandomAsciiLogo(), [])

  // 使用 useCallback 优化回调函数
  const handleCloseCommandList = useCallback(() => {
    setShowCommandList(false)
  }, [])

  // 搜索和过滤命令
  useEffect(() => {
    if (inputValue.startsWith('/') && commandRegistry) {
      const searchQuery = inputValue.slice(1).toLowerCase()
      const allCommands = commandRegistry.getAllCommands()
      
      if (searchQuery === '') {
        // 如果只输入了 /，显示所有命令
        setFilteredCommands(allCommands)
      } else {
        // 过滤匹配的命令
        const filtered = allCommands.filter(cmd => {
          const nameMatch = cmd.name.toLowerCase().includes(searchQuery)
          const aliasMatch = cmd.aliases?.some(alias => alias.toLowerCase().includes(searchQuery))
          const descMatch = cmd.description.toLowerCase().includes(searchQuery)
          return nameMatch || aliasMatch || descMatch
        })
        
        // 按匹配度排序：优先显示命令名开头匹配的
        filtered.sort((a, b) => {
          const aStartsWith = a.name.toLowerCase().startsWith(searchQuery)
          const bStartsWith = b.name.toLowerCase().startsWith(searchQuery)
          if (aStartsWith && !bStartsWith) return -1
          if (!aStartsWith && bStartsWith) return 1
          return a.name.localeCompare(b.name)
        })
        
        setFilteredCommands(filtered)
      }
      
      // 重置选中索引
      setSelectedCommandIndex(0)
      setShowCommandList(true)
    } else {
      setShowCommandList(false)
      setFilteredCommands([])
    }
  }, [inputValue, commandRegistry])

  // 使用 useCallback 优化 input 处理函数
  const handleInput = useCallback((input: string, key: Key) => {
    // 处理上下键导航命令列表
    if (showCommandList && filteredCommands.length > 0) {
      if (key.upArrow) {
        setSelectedCommandIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
        return
      }
      
      if (key.downArrow) {
        setSelectedCommandIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
        return
      }
      
      // 处理 Tab 键自动补全
      if (key.tab) {
        const selectedCommand = filteredCommands[selectedCommandIndex]
        if (selectedCommand) {
          const newValue = `/${selectedCommand.name} `
          setInputValue(newValue)
          setCursorPosition(newValue.length)
        }
        return
      }
    }

    // 处理退格键
    if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const newValue = inputValue.slice(0, cursorPosition - 1) + inputValue.slice(cursorPosition)
        setInputValue(newValue)
        setCursorPosition(cursorPosition - 1)
      }
      return
    }

    // 处理左箭头（仅在不显示命令列表时）
    if (key.leftArrow && !showCommandList) {
      setCursorPosition(Math.max(0, cursorPosition - 1))
      return
    }

    // 处理右箭头（仅在不显示命令列表时）
    if (key.rightArrow && !showCommandList) {
      setCursorPosition(Math.min(inputValue.length, cursorPosition + 1))
      return
    }

    // 处理 Home 键
    if (key.meta && input === 'a') {
      setCursorPosition(0)
      return
    }

    // 处理 End 键
    if (key.meta && input === 'e') {
      setCursorPosition(inputValue.length)
      return
    }

    // 处理回车键 - 发送消息或执行命令
    if (key.return) {
      if (inputValue.trim() && !isLoading) {
        const trimmedInput = inputValue.trim()
        
        // 如果显示命令列表且有选中的命令，执行选中的命令
        if (showCommandList && filteredCommands.length > 0) {
          const selectedCommand = filteredCommands[selectedCommandIndex]
          if (selectedCommand && trimmedInput === '/' || trimmedInput.slice(1) !== selectedCommand.name) {
            // 如果只是输入 / 或者搜索中，直接补全并等待参数
            const commandInput = `/${selectedCommand.name} `
            setInputValue(commandInput)
            setCursorPosition(commandInput.length)
            setShowCommandList(false)
            return
          }
        }
        
        // 检查是否是命令
        if (trimmedInput.startsWith('/') && commandRegistry) {
          const executed = commandRegistry.executeCommand(trimmedInput)
          if (!executed) {
            // 命令不存在,显示错误消息
            onSendMessage(trimmedInput)
          }
        } else {
          // 普通消息
          onSendMessage(trimmedInput)
        }
        
        setInputValue('')
        setCursorPosition(0)
        setShowCommandList(false)
      }
      return
    }

    // 处理普通字符输入
    if (!key.return && !key.escape && !key.ctrl && !key.meta && !key.tab && input) {
      const newValue = inputValue.slice(0, cursorPosition) + input + inputValue.slice(cursorPosition)
      setInputValue(newValue)
      setCursorPosition(cursorPosition + 1)
    }
  }, [inputValue, cursorPosition, showCommandList, filteredCommands, selectedCommandIndex, isLoading, commandRegistry, onSendMessage])

  useInput(handleInput, { isActive: true })

  // 渲染单条消息（已提取为 MessageItem 组件）

  // 渲染输入框
  const renderInput = useCallback(() => {
    const beforeCursor = inputValue.slice(0, cursorPosition)
    const atCursor = inputValue[cursorPosition] || ' '
    const afterCursor = inputValue.slice(cursorPosition + 1)

    return (
      <Box flexDirection="row">
        <Text color="cyan">› </Text>
        <Text>
          {beforeCursor}
          <Text inverse>{atCursor}</Text>
          {afterCursor}
        </Text>
        {isLoading && <Text color="yellow"> ⏳</Text>}
      </Box>
    )
  }, [inputValue, cursorPosition, isLoading])

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">💬 Chat Interface</Text>
        <Box flexGrow={1} />
        <Text color="gray" dimColor>{messages.length} messages</Text>
      </Box>

      <Box flexDirection="column" marginY={1}>
        {messages.length === 0 ? (
          <Box flexDirection="column" paddingY={2} alignItems="center" justifyContent="center">
            {/* 居中显示随机 ASCII 字符画 */}
            <Box marginBottom={2}>
              <Text color="cyan">{randomAsciiLogo}</Text>
            </Box>
            {/* 提示信息 */}
            <Box flexDirection="column" alignItems="center">
              <Text color="gray" dimColor>Start typing to begin your conversation!</Text>
              <Text color="gray" dimColor>Type / to see available commands</Text>
              <Text color="gray" dimColor>Press Enter to send message</Text>
            </Box>
          </Box>
        ) : (
          <Box flexDirection="column">
            {/* 渲染所有消息 */}
            {messages.map(message => (
              <MessageItem key={message.id} message={message} />
            ))}
          </Box>
        )}
      </Box>

      {/* Command List - Show when input starts with / */}
      {showCommandList && commandRegistry && (
        <CommandList 
          commands={filteredCommands}
          selectedIndex={selectedCommandIndex}
          searchQuery={inputValue.slice(1)}
          onClose={() => setShowCommandList(false)}
        />
      )}

      {/* Input Box - Always at Bottom */}
      <Box 
        flexDirection="column"
        borderStyle="round" 
        borderColor={isLoading ? 'yellow' : showCommandList ? 'yellow' : 'green'}
        padding={1}
      >
        <Text color="gray" dimColor>
          {showCommandList ? 'Select a command:' : 'Type your message:'}
        </Text>
        {renderInput()}
      </Box>
    </Box>
  )
}

export default ChatInterface
