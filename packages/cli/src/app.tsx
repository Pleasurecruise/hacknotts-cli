import { Box, Text, useApp, useInput } from 'ink'
import type { Key } from 'ink'
import { useMemo, useState } from 'react'
import {
  getInitializedProviders,
  getSupportedProviders
} from '@cherrystudio/ai-core/provider'
import { getRandomAsciiLogo, robotMascot } from './ui/AsciiArt'
import ChatDemo from './components/ChatDemo'
import GoodbyeBox from './components/GoodbyeBox'
import { createCommandRegistry, createProviderCommand, createHelpCommand, createClearCommand, createExitCommand } from './commands'
import { GOODBYE_MESSAGES } from './utils/constants'
import { randomChoice } from './utils/helpers'

type SupportedProvider = ReturnType<typeof getSupportedProviders>[number]
type ProviderStatus = {
  id: string
  name: string
  active: boolean
}

type ViewMode = 'providers' | 'chat'

export const App = () => {
  const { exit } = useApp()
  const supported = useMemo(() => getSupportedProviders(), [])
  const [initialized, setInitialized] = useState<string[]>(() => getInitializedProviders())
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString())
  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [hasMessages, setHasMessages] = useState(false) // 跟踪是否有消息
  const [showGoodbye, setShowGoodbye] = useState(false) // 是否显示告别消息
  const [goodbyeMessage, setGoodbyeMessage] = useState('') // 告别消息内容
  const [ctrlCPressed, setCtrlCPressed] = useState(false) // Ctrl+C 按下次数

  // 随机选择一个 ASCII 字符画，只在组件首次加载时选择一次
  const randomAsciiLogo = useMemo(() => getRandomAsciiLogo(), [])
  
  // 执行退出操作
  const performExit = (message?: string) => {
    const finalMessage = message || randomChoice(GOODBYE_MESSAGES)
    setGoodbyeMessage(finalMessage)
    setShowGoodbye(true)
    
    // 延迟退出以显示告别消息
    setTimeout(() => {
      exit()
    }, 1000)
  }
  
  // 告别消息回调
  const handleShowGoodbyeMessage = (message: string) => {
    performExit(message)
  }

  // 创建命令注册表
  const commandRegistry = useMemo(() => {
    const registry = createCommandRegistry()
    
    // 注册 provider 命令
    registry.registerCommand(
      createProviderCommand(() => {
        setViewMode('providers')
      })
    )
    
    // 注册 help 命令 (会在 ChatInterface 中特殊处理)
    registry.registerCommand(
      createHelpCommand(() => registry.getAllCommands())
    )
    
    // 注册 clear 命令 (会在 ChatDemo 中处理,通过回调传递清除函数)
    registry.registerCommand(
      createClearCommand(() => {
        // 这个回调会在 ChatDemo 中被覆盖
      })
    )
    
    // 注册 exit 命令
    registry.registerCommand(
      createExitCommand(() => {
        performExit()
      }, handleShowGoodbyeMessage)
    )
    
    return registry
  }, [])

  // 全局 Ctrl+C 处理 (二次确认机制)
  useInput((input: string, key: Key) => {
    // 如果已经显示告别消息，忽略所有输入
    if (showGoodbye) {
      return
    }

    // 处理 Ctrl+C
    if (key.ctrl && input === 'c') {
      if (ctrlCPressed) {
        // 第二次按下 Ctrl+C，执行退出
        performExit()
      } else {
        // 第一次按下 Ctrl+C，设置标志并提示
        setCtrlCPressed(true)
        // 3秒后重置标志
        setTimeout(() => {
          setCtrlCPressed(false)
        }, 3000)
      }
      return
    }
    
    // 只在 providers 视图处理这些快捷键
    if (viewMode === 'providers') {
      if (input.toLowerCase() === 'q') {
        performExit()
        return
      }
      
      // 按 C 返回 Chat 视图
      if (input.toLowerCase() === 'c') {
        setViewMode('chat')
        return
      }
    }

    // ESC 退出（在任何视图都可用）
    if (key.escape) {
      performExit()
    }
  }, { isActive: !showGoodbye })

  const statuses: ProviderStatus[] = useMemo(() => {
    const active = new Set(initialized)
  return supported.map((provider: SupportedProvider) => ({
      id: provider.id,
      name: provider.name,
      active: active.has(provider.id)
    }))
  }, [supported, initialized])

  // 如果显示告别消息，只显示告别框
  if (showGoodbye) {
    return <GoodbyeBox message={goodbyeMessage} />
  }

  // Chat View
  if (viewMode === 'chat') {
    return (
      <Box flexDirection="column">
        {/* Robot Mascot - Only show after first message */}
        {hasMessages && (
          <Box paddingX={1} paddingTop={1}>
            <Text color="cyan">{robotMascot}</Text>
          </Box>
        )}
        {/* View Switch Hint - Only show before first message */}
        {!hasMessages && (
          <Box paddingX={1} borderStyle="round" borderColor="cyan">
            <Text color="cyan">💬 HackNotts CLI • </Text>
            <Text color="gray" dimColor>Type <Text color="yellow">/provider</Text> to view providers | <Text color="yellow">ESC</Text> to exit</Text>
          </Box>
        )}
        {/* Ctrl+C 提示 */}
        {ctrlCPressed && (
          <Box paddingX={1} borderStyle="round" borderColor="red" marginBottom={1}>
            <Text color="red" bold>⚠️  Press Ctrl+C again to exit, or any other key to cancel</Text>
          </Box>
        )}
        <ChatDemo
          commandRegistry={commandRegistry}
          onShowGoodbyeMessage={handleShowGoodbyeMessage}
          onHasMessages={setHasMessages}
        />
      </Box>
    )
  }

  // Providers View
  return (
    <Box flexDirection="column" gap={1} padding={1}>
      {/* Robot Mascot - Always visible at top */}
      <Box>
        <Text color="cyan">{robotMascot}</Text>
      </Box>
      {/* Header Section */}
      <Box flexDirection="column">
        <Text color="cyan">{randomAsciiLogo}</Text>
        <Text color="magenta" bold>🔌 AI Provider Configuration Dashboard</Text>
        <Text color="gray">Powered by @cherrystudio/ai-core • HackNotts 2025</Text>
      </Box>

      {/* Main Content Box with Border */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        padding={1}
        gap={1}
      >
        {/* Provider Status Section */}
        <Box flexDirection="column">
          <Text bold color="green">📊 Initialized providers: {initialized.length}{supported.length ? ` / ${supported.length}` : ''}</Text>
          {initialized.length === 0 ? (
            <Box flexDirection="column" paddingY={1}>
              <Text color="yellow">⚠️  No providers configured yet!</Text>
              <Text color="gray">💡 Tip: Add provider API keys to .env file to get started</Text>
              <Text color="gray">   Supported: OpenAI, Anthropic, DeepSeek, Google Gemini</Text>
            </Box>
          ) : (
            <Text color="gray">🎉 Great! Your AI providers are ready to help you build amazing things!</Text>
          )}
        </Box>

        {/* Provider List */}
        <Box flexDirection="column" paddingY={1}>
          <Text color="cyan" bold>📋 Provider Status:</Text>
          {statuses.map((provider) => (
            <Text key={provider.id} color={provider.active ? 'green' : 'gray'}>
              {provider.active ? '✅' : '⬜'} {provider.name} <Text dimColor>({provider.id})</Text>
            </Text>
          ))}
        </Box>
      </Box>

      {/* Footer Section */}
      <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
        <Text color="yellow" bold>⌨️  Keyboard Shortcuts:</Text>
        <Text color="gray">  <Text color="green">C</Text> - Return to Chat   <Text color="green">R</Text> - Refresh   <Text color="green">Q/ESC</Text> - Exit</Text>
        <Text color="gray" dimColor>Last updated: {new Date(lastUpdated).toLocaleString()}</Text>
      </Box>
    </Box>
  )
}

export default App
