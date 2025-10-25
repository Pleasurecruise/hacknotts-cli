import { Box, Text, useInput } from 'ink'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import type { CommandRegistry } from '../commands'
import CommandList from './CommandList'
import LoadingSpinner from './LoadingSpinner'
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
  provider?: string
  model?: string
}

// Extract MessageItem component and optimize with memo
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

export const ChatInterface = ({ onSendMessage, messages, isLoading = false, commandRegistry, onShowGoodbyeMessage, provider, model }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showCommandList, setShowCommandList] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [filteredCommands, setFilteredCommands] = useState<any[]>([])
  
  // Randomly select an ASCII logo and quote, only once on component mount
  const randomAsciiLogo = useMemo(() => getRandomAsciiLogo(), [])
  const randomQuote = useMemo(() => getRandomQuote(), [])

  // Use command filter hook
  useCommandFilter({
    inputValue,
    commandRegistry,
    setFilteredCommands,
    setSelectedCommandIndex,
    setShowCommandList
  })

  // Reset scroll offset when filtered commands change
  useEffect(() => {
    setScrollOffset(0)
  }, [filteredCommands])

  // Use input handler hook
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
    scrollOffset,
    setScrollOffset,
    isLoading,
    commandRegistry,
    onSendMessage
  })

  useInput(handleInput, { isActive: true })

  // Render input box
  const renderInput = useCallback(() => {
    // If no input, show placeholder
    if (inputValue.length === 0) {
      return (
        <Box flexDirection="row">
          <Text color="cyan">› </Text>
          <Text color="gray" dimColor>
            {showCommandList ? 'Select a command or continue typing...' : 'Type your message...'}
          </Text>
        </Box>
      )
    }

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
      </Box>
    )
  }, [inputValue, cursorPosition, showCommandList])

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
          scrollOffset={scrollOffset}
          onClose={() => setShowCommandList(false)}
        />
      )}

      {/* Loading indicator - Above input box */}
      {isLoading && (
        <Box marginBottom={1}>
          <LoadingSpinner />
        </Box>
      )}

      {/* Input Box - Always at Bottom */}
      <Box 
        flexDirection="column"
        borderStyle="round" 
        borderColor={isLoading ? 'yellow' : showCommandList ? 'yellow' : 'green'}
        paddingX={1}
        paddingY={0}
        minHeight={3}
      >
        {renderInput()}
      </Box>

      {/* Current working directory and model info - Below input box */}
      <Box marginTop={1} justifyContent="space-between">
        <Text color="gray">
          Working Directory: <Text color="cyan">{process.cwd()}</Text>
        </Text>
        {provider && model && (
          <Text color="gray">
            Provider: <Text color="magenta">{provider}</Text> • Model: <Text color="green">{model}</Text>
          </Text>
        )}
      </Box>
    </Box>
  )
}

export default ChatInterface
