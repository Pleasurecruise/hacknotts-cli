import { Box, Text, useInput, useStdout } from 'ink'
import type { Key } from 'ink'
import { useState, useEffect } from 'react'
import type { CommandRegistry } from '../commands/types'
import CommandList from './CommandList'

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

export const ChatInterface = ({ onSendMessage, messages, isLoading = false, commandRegistry }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showCommandList, setShowCommandList] = useState(false)
  const { stdout } = useStdout()
  const [visibleMessageCount, setVisibleMessageCount] = useState(10) // 默认显示最后10条消息

  useInput((input: string, key: Key) => {
    // 处理退格键
    if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const newValue = inputValue.slice(0, cursorPosition - 1) + inputValue.slice(cursorPosition)
        setInputValue(newValue)
        setCursorPosition(cursorPosition - 1)
      }
      return
    }

    // 处理左箭头
    if (key.leftArrow) {
      setCursorPosition(Math.max(0, cursorPosition - 1))
      return
    }

    // 处理右箭头
    if (key.rightArrow) {
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
    if (!key.return && !key.escape && !key.ctrl && !key.meta && input) {
      const newValue = inputValue.slice(0, cursorPosition) + input + inputValue.slice(cursorPosition)
      setInputValue(newValue)
      setCursorPosition(cursorPosition + 1)
      
      // 检查是否应该显示命令列表
      if (newValue.startsWith('/') && commandRegistry) {
        setShowCommandList(true)
      } else {
        setShowCommandList(false)
      }
    }
  })

  // 根据终端高度动态调整可见消息数量
  useEffect(() => {
    if (stdout.rows) {
      // 预留空间给标题、输入框和边框
      const availableRows = stdout.rows - 10
      const messagesPerRow = 4 // 每条消息大约占用的行数
      const maxVisible = Math.max(5, Math.floor(availableRows / messagesPerRow))
      setVisibleMessageCount(maxVisible)
    }
  }, [stdout.rows])

  // 渲染单条消息
  const renderMessage = (message: Message) => {
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
      <Box key={message.id} flexDirection="column" marginBottom={1}>
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
  }

  // 渲染输入框
  const renderInput = () => {
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
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">💬 Chat Interface</Text>
        <Box flexGrow={1} />
        <Text color="gray" dimColor>{messages.length} messages</Text>
      </Box>

      {/* Messages Area - 动态渲染最近的消息,避免使用Static导致终端累积 */}
      <Box flexDirection="column" marginY={1}>
        {messages.length === 0 ? (
          <Box flexDirection="column" paddingY={2}>
            <Text color="gray" dimColor>No messages yet. Start typing to begin!</Text>
            <Text color="gray" dimColor>Type / to see available commands</Text>
            <Text color="gray" dimColor>Press Enter to send message</Text>
          </Box>
        ) : (
          <Box flexDirection="column">
            {/* 显示消息数量提示 */}
            {messages.length > visibleMessageCount && (
              <Box marginBottom={1}>
                <Text color="gray" dimColor>
                  ... {messages.length - visibleMessageCount} earlier messages hidden
                </Text>
              </Box>
            )}
            
            {/* 只渲染最近的消息 */}
            {messages.slice(-visibleMessageCount).map(renderMessage)}
          </Box>
        )}
      </Box>

      {/* Command List - Show when input starts with / */}
      {showCommandList && commandRegistry && (
        <CommandList 
          commands={commandRegistry.getAllCommands()}
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
