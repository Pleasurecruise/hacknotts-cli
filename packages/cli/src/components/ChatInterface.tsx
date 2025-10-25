import { Box, Text, useInput } from 'ink'
import type { Key } from 'ink'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import type { CommandRegistry } from '../commands'
import CommandList from './CommandList'
import { getRandomAsciiLogo, getRandomQuote, decorativeBanner } from '../ui/AsciiArt'

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

export const ChatInterface = ({ onSendMessage, messages, isLoading = false, commandRegistry, onShowGoodbyeMessage }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showCommandList, setShowCommandList] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [filteredCommands, setFilteredCommands] = useState<any[]>([])
  
  // 随机选择一个 ASCII 字符画和名言，只在组件首次加载时选择一次
  const randomAsciiLogo = useMemo(() => getRandomAsciiLogo(), [])
  const randomQuote = useMemo(() => getRandomQuote(), [])

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
        const chars = Array.from(inputValue)
        const beforeCursor = chars.slice(0, cursorPosition - 1).join('')
        const afterCursor = chars.slice(cursorPosition).join('')
        const newValue = beforeCursor + afterCursor
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
      const maxPosition = Array.from(inputValue).length
      setCursorPosition(Math.min(maxPosition, cursorPosition + 1))
      return
    }

    // 处理 Home 键
    if (key.meta && input === 'a') {
      setCursorPosition(0)
      return
    }

    // 处理 End 键
    if (key.meta && input === 'e') {
      setCursorPosition(Array.from(inputValue).length)
      return
    }

    // 处理回车键 - 发送消息或执行命令
    if (key.return) {
      if (inputValue.trim() && !isLoading) {
        const trimmedInput = inputValue.trim()
        
        // 检查是否是命令
        if (trimmedInput.startsWith('/') && commandRegistry) {
          // 移除开头的 /
          const commandText = trimmedInput.slice(1).toLowerCase()
          
          // 如果输入可以匹配到命令（包括别名），直接执行
          const command = commandRegistry.getCommand(commandText.split(/\s+/)[0])
          if (command) {
            // 创建一个包装的执行函数，用于捕获告别消息
            let goodbyeMessage: string | undefined
            
            // 临时替换 exit 命令的回调来捕获告别消息
            if (command.name === 'exit' && onShowGoodbyeMessage) {
              const originalExecute = command.execute
              command.execute = (args) => {
                // 调用原始执行，但拦截告别消息
                const showGoodbye = (msg: string) => {
                  goodbyeMessage = msg
                  onSendMessage('', msg) // 通过 onSendMessage 显示告别消息
                }
                
                // 重新创建带告别消息的命令
                const exitCommand = commandRegistry.getCommand('exit')
                if (exitCommand) {
                  // 直接在这里生成并显示告别消息 - HackNotts themed!
                  const goodbyeMessages = [
                    '👋 Goodbye! Thanks for using HackNotts CLI! Keep hacking with playful cleverness!',
                    '✨ See you at HackNotts 2025! Build something amazing!',
                    '🌟 Farewell, hacker! May your code compile and your ideas flourish!',
                    '💫 Until next time! Remember: every expert was once a beginner.',
                    '🎉 Happy coding! See you at the University of Nottingham!',
                    '🚀 Off you go! Time to turn those ideas into reality!',
                    '🏆 Keep learning, keep building! HackNotts believes in you!',
                    '💡 Goodbye! Don\'t forget: code is poetry, and you\'re the poet!'
                  ]
                  const randomMessage = goodbyeMessages[Math.floor(Math.random() * goodbyeMessages.length)]
                  onSendMessage('', randomMessage)
                }
                
                // 调用原始执行
                originalExecute(args || [])
              }
            }
            
            commandRegistry.executeCommand(trimmedInput)
          } else if (showCommandList && filteredCommands.length > 0) {
            // 如果命令不存在但有匹配的建议，不执行，只显示错误
            onSendMessage(trimmedInput)
          } else {
            // 命令不存在
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
      // 使用字符数组来正确处理多字节字符
      const chars = Array.from(inputValue)
      const beforeCursor = chars.slice(0, cursorPosition)
      const afterCursor = chars.slice(cursorPosition)
      
      // 将新输入也转换为字符数组
      const newChars = Array.from(input)
      const newValue = [...beforeCursor, ...newChars, ...afterCursor].join('')
      
      setInputValue(newValue)
      // 光标位置向后移动输入字符的数量
      setCursorPosition(cursorPosition + newChars.length)
    }
  }, [inputValue, cursorPosition, showCommandList, filteredCommands, selectedCommandIndex, isLoading, commandRegistry, onSendMessage, onShowGoodbyeMessage])

  useInput(handleInput, { isActive: true })

  // 渲染单条消息（已提取为 MessageItem 组件）

  // 渲染输入框
  const renderInput = useCallback(() => {
    // 使用 Array.from 正确处理包含中文等多字节字符的字符串
    const chars = Array.from(inputValue)
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
