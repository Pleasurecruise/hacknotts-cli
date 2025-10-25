import { Box, Text, useInput } from 'ink'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import type { CommandRegistry } from '../commands'
import CommandList from './CommandList'
import { getRandomAsciiLogo, getRandomQuote, decorativeBanner } from '../ui/AsciiArt'
import { MESSAGE_ROLE_CONFIG } from '../utils/constants'
import { StringHelper } from '../utils/helpers'
import { useInputHandler } from '../hooks/useInputHandler'
import { useCommandFilter } from '../hooks/useCommandFilter'

export type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

type ChatInterfaceProps = {
  onSendMessage: (message: string, showGoodbyeMessage?: string) => void
  messages: Message[]
  isLoading?: boolean
  commandRegistry?: CommandRegistry
  onShowGoodbyeMessage?: (message: string) => void
}

// 提取 MessageItem 组件并使用 memo 优化
const MessageItem = memo(({ message }: { message: Message }) => {
  const config = MESSAGE_ROLE_CONFIG[message.role]
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color={config.color}>
          {config.displayName}
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

export const ChatInterface = ({ onSendMessage, messages, isLoading = false, commandRegistry, onShowGoodbyeMessage }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showCommandList, setShowCommandList] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [filteredCommands, setFilteredCommands] = useState<any[]>([])
  
  // 随机选择一个 ASCII 字符画和名言，只在组件首次加载时选择一次
  const randomAsciiLogo = useMemo(() => getRandomAsciiLogo(), [])
  const randomQuote = useMemo(() => getRandomQuote(), [])

  // 使用命令过滤 hook
  useCommandFilter({
    inputValue,
    commandRegistry,
    setFilteredCommands,
    setSelectedCommandIndex,
    setShowCommandList
  })

  // 使用输入处理 hook
  const handleInput = useInputHandler({
    inputValue,
    setInputValue,
    cursorPosition,
    setCursorPosition,
    showCommandList,
    setShowCommandList,
    filteredCommands,
    selectedCommandIndex,
    setSelectedCommandIndex,
    isLoading,
    commandRegistry,
    onSendMessage
  })

  useInput(handleInput, { isActive: true })

  // 渲染输入框
  const renderInput = useCallback(() => {
    const chars = StringHelper.toChars(inputValue)
    const beforeCursor = chars.slice(0, cursorPosition).join('')
    const atCursor = chars[cursorPosition] || ' '
    const afterCursor = chars.slice(cursorPosition + 1).join('')

    return (
      <Box flexDirection="row">
        <Text color="cyan">› </Text>
        <Text>
          {beforeCursor}
          <Text inverse color="white" backgroundColor="cyan">{atCursor}</Text>
          {afterCursor}
        </Text>
        {isLoading && <Text color="yellow"> ⏳</Text>}
      </Box>
    )
  }, [inputValue, cursorPosition, isLoading])

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginY={1}>
        {messages.length === 0 ? (
          <Box flexDirection="column" paddingY={1} paddingX={2}>
            {/* ASCII 字符画 */}
            <Box marginBottom={1}>
              <Text color="cyan">{randomAsciiLogo}</Text>
            </Box>
            {/* 装饰性横幅 */}
            <Box marginBottom={1}>
              <Text color="magenta">{decorativeBanner}</Text>
            </Box>
            {/* 励志名言 */}
            <Box marginBottom={1}>
              <Text color="yellow">{randomQuote}</Text>
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
