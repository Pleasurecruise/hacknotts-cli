import { Box, Text, useApp, useInput } from 'ink'
import type { Key } from 'ink'
import { useMemo, useState, useCallback } from 'react'
import type { ProviderId } from '@cherrystudio/ai-core/provider'
import {
  getInitializedProviders,
  getSupportedProviders
} from '@cherrystudio/ai-core/provider'
import { getRandomAsciiLogo, robotMascot } from './ui/AsciiArt'
import ChatDemo from './components/ChatDemo'
import GoodbyeBox from './components/GoodbyeBox'
import AnimationContainer from './components/AnimationContainer'
import type { AIConfig } from './services/aiService'
import { createCommandRegistry, createProviderCommand, createHelpCommand, createClearCommand, createExitCommand } from './commands'
import { GOODBYE_MESSAGES } from './utils/constants'
import { randomChoice } from './utils/helpers'

type SupportedProvider = ReturnType<typeof getSupportedProviders>[number]
type ProviderStatus = {
  id: string
  name: string
  active: boolean
  model?: string
  isCurrent?: boolean
}

type ViewMode = 'providers' | 'chat'
type AppState = 'startup' | 'running' | 'shutdown'

export const App = () => {
  const { exit } = useApp()
  const supported = useMemo(() => getSupportedProviders(), [])
  const [initialized, setInitialized] = useState<string[]>(() => getInitializedProviders())
  const [providerConfigs, setProviderConfigs] = useState<AIConfig[]>([])
  const [currentProviderId, setCurrentProviderId] = useState<ProviderId | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString())
  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [hasMessages, setHasMessages] = useState(false) // 跟踪是否有消息
  const [showGoodbye, setShowGoodbye] = useState(false) // 是否显示告别消息
  const [goodbyeMessage, setGoodbyeMessage] = useState('') // 告别消息内容
  const [ctrlCPressed, setCtrlCPressed] = useState(false) // Ctrl+C 按下次数
  const [appState, setAppState] = useState<AppState>('startup') // 应用状态

  // 随机选择一个 ASCII 字符画，只在组件首次加载时选择一次
  const randomAsciiLogo = useMemo(() => getRandomAsciiLogo(), [])
  
  // 执行退出操作
  const performExit = (message?: string) => {
    const finalMessage = message || randomChoice(GOODBYE_MESSAGES)
    setGoodbyeMessage(finalMessage)
    
    // 切换到关闭状态，播放关闭动画
    setAppState('shutdown')
  }
  
  // 启动动画完成
  const handleStartupComplete = () => {
    setAppState('running')
  }
  
  // 关闭动画完成
  const handleShutdownComplete = () => {
    exit()
  }
  

  // 处理 provider 切换事件
  const handleProviderSwitch = useCallback((providerId: ProviderId, configs: AIConfig[]) => {
    setCurrentProviderId(providerId)
    setProviderConfigs(configs)
    setInitialized(configs.map(c => c.providerId))
    setLastUpdated(new Date().toISOString())

    // 更新选中索引为当前 provider
    const activeStatuses = configs.map(config => {
      const supportedProvider = supported.find(s => s.id === config.providerId)
      return {
        id: config.providerId,
        name: supportedProvider?.name || config.providerId,
        active: true,
        model: config.model
      }
    })
    const currentIndex = activeStatuses.findIndex(s => s.id === providerId)
    if (currentIndex >= 0) {
      setSelectedIndex(currentIndex)
    }
  }, [supported])

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
    // 如果正在播放启动或关闭动画，忽略所有输入
    if (appState === 'startup' || appState === 'shutdown') {
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
      // 上箭头 - 向上选择
      if (key.upArrow) {
        setSelectedIndex(prev => {
          const activeProviders = providerConfigs.length
          return prev > 0 ? prev - 1 : activeProviders - 1
        })
        return
      }

      // 下箭头 - 向下选择
      if (key.downArrow) {
        setSelectedIndex(prev => {
          const activeProviders = providerConfigs.length
          return prev < activeProviders - 1 ? prev + 1 : 0
        })
        return
      }

      // Enter - 切换到选中的 provider
      if (key.return && providerConfigs.length > 0) {
        const selectedConfig = providerConfigs[selectedIndex]
        if (selectedConfig && (globalThis as any).__switchProvider) {
          ;(globalThis as any).__switchProvider(selectedConfig.providerId)
          setViewMode('chat') // 切换后返回聊天视图
        }
        return
      }

      // R - 刷新
      if (input.toLowerCase() === 'r') {
        setLastUpdated(new Date().toISOString())
        return
      }

      if (key.ctrl && input === 'c' || input.toLowerCase() === 'q') {
        exit()
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
  }, { isActive: appState === 'running' })

  const statuses: ProviderStatus[] = useMemo(() => {
    // 只显示已初始化的 providers
    return providerConfigs.map((config) => {
      const supportedProvider = supported.find(s => s.id === config.providerId)
      return {
        id: config.providerId,
        name: supportedProvider?.name || config.providerId,
        active: true,
        model: config.model,
        isCurrent: config.providerId === currentProviderId
      }
    })
  }, [providerConfigs, currentProviderId, supported])

  // 显示启动动画
  if (appState === 'startup') {
    return (
      <AnimationContainer
        type="startup"
        onComplete={handleStartupComplete}
      />
    )
  }

  // 显示关闭动画
  if (appState === 'shutdown') {
    return (
      <AnimationContainer
        type="shutdown"
        onComplete={handleShutdownComplete}
        goodbyeMessage={goodbyeMessage}
      />
    )
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
          onProviderSwitch={handleProviderSwitch}
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
          <Text color="cyan" bold>📋 Available Providers:</Text>
          {statuses.length === 0 ? (
            <Text color="gray" dimColor>  No providers initialized yet</Text>
          ) : (
            statuses.map((provider, index) => {
              const isSelected = index === selectedIndex
              const isCurrent = provider.isCurrent

              return (
                <Box key={provider.id} paddingX={1}>
                  <Text
                    color={isCurrent ? 'green' : isSelected ? 'yellow' : 'white'}
                    bold={isCurrent || isSelected}
                  >
                    {isSelected ? '▶ ' : '  '}
                    {isCurrent ? '⚡' : '✓'} {provider.name}
                    <Text dimColor> ({provider.id})</Text>
                    {provider.model && (
                      <Text color="cyan" dimColor> • {provider.model}</Text>
                    )}
                    {isCurrent && <Text color="green"> [ACTIVE]</Text>}
                  </Text>
                </Box>
              )
            })
          )}
        </Box>
      </Box>

      {/* Footer Section */}
      <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
        <Text color="yellow" bold>⌨️  Keyboard Shortcuts:</Text>
        <Text color="gray">  <Text color="green">↑/↓</Text> - Navigate   <Text color="green">Enter</Text> - Switch Provider   <Text color="green">C</Text> - Return to Chat</Text>
        <Text color="gray">  <Text color="green">R</Text> - Refresh   <Text color="green">Q/ESC</Text> - Exit</Text>
        <Text color="gray" dimColor>Last updated: {new Date(lastUpdated).toLocaleString()}</Text>
        {currentProviderId && (
          <Text color="green" dimColor>Current provider: {currentProviderId}</Text>
        )}
      </Box>
    </Box>
  )
}

export default App
