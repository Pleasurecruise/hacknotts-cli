import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, useInput } from 'ink'
import type { Key } from 'ink'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import type { ProviderId } from '@cherrystudio/ai-core/provider'
import ChatInterface, { type Message, type StatusBarController } from './ChatInterface'
import type { CommandRegistry } from '../commands/types'
import type { ProviderStatus } from '../types/app'
import { initializeAllProviders, streamAIChat, type AIConfig } from '../services/aiService'
import { getDefaultProvider, setDefaultProvider } from '../services/configService'
import { createMessage, isCommand, parseCommand } from '../utils/helpers'
import { getRenderInstance } from '../index'

type ChatSessionProps = {
  commandRegistry?: CommandRegistry
  onHasMessages?: (hasMessages: boolean) => void
  onProviderSwitch?: (providerId: ProviderId, configs: AIConfig[]) => void
  onRegisterClear?: (handler: (() => void) | null) => void
  onRegisterProviderSwitcher?: (handler: ((providerId: ProviderId) => boolean) | null) => void
  onRegisterMessagesGetter?: (handler: (() => Message[]) | null) => void
  onRegisterStatusBarController?: (controller: StatusBarController | null) => void
  onRegisterModelSwitcher?: (handler: ((modelName?: string) => void) | null) => void
  onRegisterCdHandler?: (handler: ((directory?: string) => void) | null) => void
  ctrlCPressed?: boolean
  onLoadingChange?: (isLoading: boolean) => void
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

export const ChatSession = ({
  commandRegistry,
  onHasMessages,
  onProviderSwitch,
  onRegisterClear,
  onRegisterProviderSwitcher,
  onRegisterMessagesGetter,
  onRegisterStatusBarController,
  onRegisterModelSwitcher,
  onRegisterCdHandler,
  ctrlCPressed = false,
  onLoadingChange,
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
}: ChatSessionProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([])
  const [currentConfig, setCurrentConfig] = useState<AIConfig | null>(null)
  const [temporaryModel, setTemporaryModel] = useState<string | null>(null)
  const [currentDirectory, setCurrentDirectory] = useState<string>(process.cwd())
  const initRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const statusBarRef = useRef<StatusBarController | null>(null)

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setIsLoading(false)
    setMessages([])

    const instance = getRenderInstance()
    if (instance) {
      instance.clear()
    }
  }, [])

  const getMessages = useCallback(() => {
    return messages
  }, [messages])

  useEffect(() => {
    if (!onRegisterClear) {
      return
    }

    onRegisterClear(clearMessages)
    return () => {
      onRegisterClear(null)
    }
  }, [clearMessages, onRegisterClear])

  useEffect(() => {
    if (!onRegisterMessagesGetter) {
      return
    }

    onRegisterMessagesGetter(getMessages)
    return () => {
      onRegisterMessagesGetter(null)
    }
  }, [getMessages, onRegisterMessagesGetter])

  useEffect(() => {
    onHasMessages?.(messages.length > 0)
  }, [messages.length, onHasMessages])

  useEffect(() => {
    onLoadingChange?.(isLoading)
  }, [isLoading, onLoadingChange])

  useInput((input: string, key: Key) => {
    if (key.ctrl && input === 'c' && isLoading) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setIsLoading(false)

      statusBarRef.current?.showInfo('Request cancelled')
    }
  }, { isActive: isLoading })

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const init = async () => {
      const configs = await initializeAllProviders()

      if (configs.length === 0) {
        statusBarRef.current?.showError(
          'Failed to initialize AI provider. Please check your environment variables (.env file) and make sure you have set a valid API key.'
        )
        return
      }

      setAiConfigs(configs)

      const savedDefaultProvider = getDefaultProvider()
      let selectedConfig = configs.find(c => c.providerId === savedDefaultProvider)
      if (!selectedConfig) {
        selectedConfig = configs[0]
      }

      setCurrentConfig(selectedConfig)

      if (onProviderSwitch && selectedConfig) {
        onProviderSwitch(selectedConfig.providerId, configs)
      }
    }
    init()
  }, [onProviderSwitch])

  const streamAIResponse = useCallback(async (conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) => {
    if (!currentConfig) {
      statusBarRef.current?.showError('AI provider is not initialized. Cannot generate response.')
      setIsLoading(false)
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const aiMessage = createMessage('assistant', '', { isStreaming: true })
    const aiMessageId = aiMessage.id

    setMessages(prev => [...prev, aiMessage])

    // 使用临时模型或默认模型
    const effectiveConfig = temporaryModel 
      ? { ...currentConfig, model: temporaryModel }
      : currentConfig

    try {
      for await (const chunk of streamAIChat(conversationHistory, effectiveConfig)) {
        if (abortController.signal.aborted) {
          break
        }

        setMessages(prev => {
          const lastMessageIndex = prev.length - 1
          const lastMessage = prev[lastMessageIndex]
          if (lastMessage && lastMessage.id === aiMessageId) {
            return [
              ...prev.slice(0, lastMessageIndex),
              {
                ...lastMessage,
                content: lastMessage.content + chunk
              }
            ]
          }
          return prev
        })
      }

      if (abortController.signal.aborted) {
        return
      }

      setMessages(prev => {
        const lastMessageIndex = prev.length - 1
        const lastMessage = prev[lastMessageIndex]
        if (lastMessage && lastMessage.id === aiMessageId) {
          return [
            ...prev.slice(0, lastMessageIndex),
            {
              ...lastMessage,
              isStreaming: false
            }
          ]
        }
        return prev
      })
    } catch (error) {
      if (abortController.signal.aborted) {
        return
      }

      statusBarRef.current?.showError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      )
    } finally {
      abortControllerRef.current = null
      setIsLoading(false)
    }
  }, [currentConfig, temporaryModel])

  const switchProvider = useCallback((providerId: ProviderId) => {
    const targetConfig = aiConfigs.find(c => c.providerId === providerId)

    if (!targetConfig) {
      statusBarRef.current?.showError(`Provider "${providerId}" not found or not initialized.`)
      return false
    }

    setCurrentConfig(targetConfig)
    setTemporaryModel(null) // 清除临时模型
    setDefaultProvider(providerId, targetConfig.model)

    statusBarRef.current?.showInfo(
      `Switched to ${targetConfig.providerId} provider (model: ${targetConfig.model})`
    )

    if (onProviderSwitch) {
      onProviderSwitch(providerId, aiConfigs)
    }

    return true
  }, [aiConfigs, onProviderSwitch])

  const switchModel = useCallback((modelName?: string) => {
    if (!currentConfig) {
      statusBarRef.current?.showError('No provider is currently active. Please select a provider first.')
      return
    }

    if (!modelName) {
      // 如果没有提供模型名称，显示当前模型信息
      const displayModel = temporaryModel || currentConfig.model
      const isTemp = temporaryModel !== null
      statusBarRef.current?.showInfo(
        `Current model: ${displayModel} (${currentConfig.providerId})${isTemp ? ' [Temporary]' : ''}`
      )
      return
    }

    // 设置临时模型
    setTemporaryModel(modelName)
    statusBarRef.current?.showSuccess(
      `Temporarily switched to model: ${modelName} (${currentConfig.providerId})`,
      0
    )
  }, [currentConfig, temporaryModel])

  const handleCd = useCallback((directory?: string) => {
    if (!directory) {
      // 如果没有提供目录，显示当前工作目录
      statusBarRef.current?.showInfo(`Current working directory: ${currentDirectory}`)
      return
    }

    try {
      // 解析路径（支持相对路径和绝对路径）
      const targetPath = resolve(currentDirectory, directory)

      // 检查目录是否存在
      if (!existsSync(targetPath)) {
        statusBarRef.current?.showError(`Directory does not exist: ${targetPath}`)
        return
      }

      // 更新当前目录
      setCurrentDirectory(targetPath)
      process.chdir(targetPath)
      
      statusBarRef.current?.showSuccess(`Changed directory to: ${targetPath}`, 0)
    } catch (error) {
      statusBarRef.current?.showError(
        error instanceof Error ? error.message : 'Failed to change directory'
      )
    }
  }, [currentDirectory])

  useEffect(() => {
    if (!onRegisterProviderSwitcher) {
      return
    }

    onRegisterProviderSwitcher(switchProvider)
    return () => {
      onRegisterProviderSwitcher(null)
    }
  }, [onRegisterProviderSwitcher, switchProvider])

  useEffect(() => {
    if (!onRegisterModelSwitcher) {
      return
    }

    onRegisterModelSwitcher(switchModel)
    return () => {
      onRegisterModelSwitcher(null)
    }
  }, [onRegisterModelSwitcher, switchModel])

  useEffect(() => {
    if (!onRegisterCdHandler) {
      return
    }

    onRegisterCdHandler(handleCd)
    return () => {
      onRegisterCdHandler(null)
    }
  }, [onRegisterCdHandler, handleCd])

  const handleSendMessage = useCallback((content: string) => {
    if (isCommand(content)) {
      const { command } = parseCommand(content)
      statusBarRef.current?.showWarning(`Unknown command: ${content}. Type / to see available commands.`)
      return
    }

    setMessages(prev => [...prev, createMessage('user', content)])
    setIsLoading(true)

    const conversationHistory = [
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content
      }
    ]

    streamAIResponse(conversationHistory)
  }, [messages, streamAIResponse])

  const handleStatusBarReady = useCallback((controller: StatusBarController) => {
    statusBarRef.current = controller
    
    // 同时注册到父组件
    if (onRegisterStatusBarController) {
      onRegisterStatusBarController(controller)
    }
  }, [onRegisterStatusBarController])

  // 清理时注销 statusBar 控制器
  useEffect(() => {
    return () => {
      if (onRegisterStatusBarController) {
        onRegisterStatusBarController(null)
      }
    }
  }, [onRegisterStatusBarController])

  return (
    <Box flexDirection="column" padding={1}>
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        commandRegistry={commandRegistry}
        provider={currentConfig?.providerId}
        model={temporaryModel || currentConfig?.model}
        onStatusBarReady={handleStatusBarReady}
        ctrlCPressed={ctrlCPressed}
        showProviderView={showProviderView}
        providerStatuses={providerStatuses}
        selectedProviderIndex={selectedProviderIndex}
        initializedCount={initializedCount}
        supportedCount={supportedCount}
        currentProviderId={currentProviderId}
        onCloseProviderView={onCloseProviderView}
        onSelectPreviousProvider={onSelectPreviousProvider}
        onSelectNextProvider={onSelectNextProvider}
        onSwitchToProvider={onSwitchToProvider}
      />
    </Box>
  )
}

export default ChatSession
