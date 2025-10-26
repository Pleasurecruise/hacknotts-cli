import { Box, Text, useInput } from 'ink'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import type { ProviderId } from '@cherrystudio/ai-core/provider'
import type { CommandRegistry } from '../commands'
import type { ProviderStatus } from '../types/app'
import CommandList from './CommandList'
import HelpView from './HelpView'
import { AboutView } from './AboutView'
import ProviderView from './ProviderView'
import LoadingSpinner from './LoadingSpinner'
import StatusBar from './StatusBar'
import { getRandomAsciiLogo, getRandomQuote, decorativeBanner, robotMascot } from '../ui/AsciiArt'
import { MESSAGE_ROLE_CONFIG } from '../utils/constants'
import { StringHelper } from '../utils/helpers'
import { useInputHandler } from '../hooks/useInputHandler'
import { useCommandFilter } from '../hooks/useCommandFilter'
import { useStatusBar } from '../hooks/useStatusBar'
import { useInputHistory } from '../hooks/useInputHistory'
import AnimatedGradient from './AnimatedGradient'

export type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export type StatusBarController = {
  showInfo: (content: string, autoDismiss?: number) => void
  showWarning: (content: string, autoDismiss?: number) => void
  showError: (content: string, autoDismiss?: number) => void
  showSuccess: (content: string, autoDismiss?: number) => void
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
  // Provider view props
  showProviderView?: boolean
  providerStatuses?: ProviderStatus[]
  selectedProviderIndex?: number
  initializedCount?: number
  supportedCount?: number
  currentProviderId?: ProviderId | null
  onCloseProviderView?: () => void
  onSelectPreviousProvider?: () => void
  onSelectNextProvider?: () => void
  onSwitchToProvider?: (index: number) => void
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

export const ChatInterface = ({ 
  onSendMessage, 
  messages, 
  isLoading = false, 
  commandRegistry, 
  provider, 
  model, 
  onStatusBarReady, 
  ctrlCPressed = false,
  showProviderView = false,
  providerStatuses = [],
  selectedProviderIndex = 0,
  initializedCount = 0,
  supportedCount = 0,
  currentProviderId = null,
  onCloseProviderView,
  onSelectPreviousProvider,
  onSelectNextProvider,
  onSwitchToProvider
}: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showCommandList, setShowCommandList] = useState(false)
  const [showHelpView, setShowHelpView] = useState(false)
  const [showAboutView, setShowAboutView] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [filteredCommands, setFilteredCommands] = useState<any[]>([])
  
  // 输入历史 hook
  const { addToHistory, navigateHistory, resetNavigation } = useInputHistory({ maxHistorySize: 50 })
  
  // Status bar hook
  const { statusMessage, showInfo, showWarning, showError, showSuccess, clearStatus } = useStatusBar()
  
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
        showSuccess,
        clearStatus
      })
    }
  }, [onStatusBarReady, showInfo, showWarning, showError, showSuccess, clearStatus])

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
    showHelpView,
    setShowHelpView,
    showAboutView,
    setShowAboutView,
    filteredCommands,
    selectedCommandIndex,
    setSelectedCommandIndex,
    scrollOffset,
    setScrollOffset,
    isLoading,
    commandRegistry,
    onSendMessage,
    onNavigateHistory: navigateHistory,
    onResetHistoryNavigation: resetNavigation,
    onMessageSent: addToHistory
  })

  useInput(handleInput, { isActive: !showHelpView && !showAboutView && !showProviderView })

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
      {/* Help View - Full screen overlay */}
      {showHelpView && commandRegistry && (
        <HelpView 
          commands={commandRegistry.getAllCommands()}
          onClose={() => setShowHelpView(false)}
        />
      )}

      {/* About View - Full screen overlay */}
      {showAboutView && (
        <AboutView 
          onClose={() => setShowAboutView(false)}
        />
      )}

      {/* Provider View - Full screen overlay */}
      {showProviderView && onCloseProviderView && onSelectPreviousProvider && onSelectNextProvider && onSwitchToProvider && (
        <ProviderView
          statuses={providerStatuses}
          selectedIndex={selectedProviderIndex}
          initializedCount={initializedCount}
          supportedCount={supportedCount}
          currentProviderId={currentProviderId}
          robotMascotArt={robotMascot}
          onClose={onCloseProviderView}
          onSelectPrevious={onSelectPreviousProvider}
          onSelectNext={onSelectNextProvider}
          onSwitchProvider={onSwitchToProvider}
        />
      )}

      {/* Only show chat interface when overlays are not shown */}
      {!showHelpView && !showAboutView && !showProviderView && (
        <>
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
        </>
      )}
    </Box>
  )
}

export default ChatInterface
