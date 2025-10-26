import { Box, Text, useInput } from 'ink'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import type { CommandRegistry } from '../commands'
import CommandList from './CommandList'
import LoadingSpinner from './LoadingSpinner'
import StatusBar from './StatusBar'
import { getRandomAsciiLogo, getRandomQuote, decorativeBanner } from '../ui/AsciiArt'
import { MESSAGE_ROLE_CONFIG } from '../utils/constants'
import { StringHelper } from '../utils/helpers'
import { useInputHandler } from '../hooks/useInputHandler'
import { useCommandFilter } from '../hooks/useCommandFilter'
import { useStatusBar } from '../hooks/useStatusBar'
import AnimatedGradient from './AnimatedGradient'

export type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export type StatusBarController = {
  showInfo: (content: string) => void
  showWarning: (content: string) => void
  showError: (content: string) => void
  clearStatus: () => void
}

type ChatInterfaceProps = {
  onSendMessage: (message: string) => void
  messages: Message[]
  isLoading?: boolean
  commandRegistry?: CommandRegistry
  provider?: string
  model?: string
  onStatusBarReady?: (controller: StatusBarController) => void
  ctrlCPressed?: boolean
}

// Extract MessageItem component and optimize with memo
const MessageItem = memo(({ message }: { message: Message }) => {
  const config = MESSAGE_ROLE_CONFIG[message.role]
  
  // Use markdown for assistant messages, plain text for others
  const renderContent = () => {
    // TODO: Add markdown support back when ink-markdown compatibility is fixed
    // if (message.role === 'assistant') {
    //   return <Markdown>{message.content}</Markdown>
    // }
    
    // Plain text for all messages
    return (
      <Text wrap="wrap">
        {message.content}
        {message.isStreaming && <Text color="gray">▋</Text>}
      </Text>
    )
  }
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color={config.color}>
          {config.displayName}
        </Text>
        <Text color="gray" dimColor> • {message.timestamp.toLocaleTimeString()}</Text>
      </Box>
      <Box paddingLeft={2}>
        {renderContent()}
      </Box>
    </Box>
  )
})

MessageItem.displayName = 'MessageItem'

export const ChatInterface = ({ onSendMessage, messages, isLoading = false, commandRegistry, provider, model, onStatusBarReady, ctrlCPressed = false }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showCommandList, setShowCommandList] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [filteredCommands, setFilteredCommands] = useState<any[]>([])
  
  // Status bar hook
  const { statusMessage, showInfo, showWarning, showError, clearStatus } = useStatusBar()
  
  // Randomly select an ASCII logo and quote, only once on component mount
  const randomAsciiLogo = useMemo(() => getRandomAsciiLogo(), [])
  const randomQuote = useMemo(() => getRandomQuote(), [])

  // Show Ctrl+C warning in status bar
  useEffect(() => {
    if (ctrlCPressed) {
      showWarning('Press Ctrl+C again to exit, or any other key to cancel')
    }
  }, [ctrlCPressed, showWarning])

  // Expose status bar controller to parent
  useEffect(() => {
    if (onStatusBarReady) {
      onStatusBarReady({
        showInfo,
        showWarning,
        showError,
        clearStatus
      })
    }
  }, [onStatusBarReady, showInfo, showWarning, showError, clearStatus])

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
            {showCommandList ? 'Select a command or continue typing...' : 'Type your message or use / to see commands...'}
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
              <Text color="#00FF00">{randomAsciiLogo}</Text>
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

      {/* Status Bar - Below input box */}
      <StatusBar 
        statusMessage={statusMessage}
        onDismiss={clearStatus}
        provider={provider}
        model={model}
      />
    </Box>
  )
}

export default ChatInterface
