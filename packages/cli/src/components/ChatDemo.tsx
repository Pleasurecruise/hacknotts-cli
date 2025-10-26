import { useState, useEffect, useCallback, useRef } from 'react'
import { Box, useInput } from 'ink'
import type { Key } from 'ink'
import type { ProviderId } from '@cherrystudio/ai-core/provider'
import ChatInterface, { type Message } from './ChatInterface'
import type { CommandRegistry } from '../commands/types'
import { initializeAllProviders, streamAIChat, type AIConfig } from '../services/aiService'
import { getDefaultProvider, setDefaultProvider } from '../services/configService'
import { createMessage, isCommand, parseCommand } from '../utils/helpers'
import { getRenderInstance } from '../index'

type ChatDemoProps = {
  commandRegistry?: CommandRegistry
  onShowGoodbyeMessage?: (message: string) => void
  onHasMessages?: (hasMessages: boolean) => void
  onProviderSwitch?: (providerId: ProviderId, configs: AIConfig[]) => void
}

export const ChatDemo = ({ commandRegistry, onShowGoodbyeMessage, onHasMessages, onProviderSwitch }: ChatDemoProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([]) // 所有已初始化的配置
  const [currentConfig, setCurrentConfig] = useState<AIConfig | null>(null) // 当前使用的配置
  const initRef = useRef(false) // Prevent duplicate initialization
  const abortControllerRef = useRef<AbortController | null>(null) // For request cancellation

  // Notify parent component of message state changes
  useEffect(() => {
    onHasMessages?.(messages.length > 0)
  }, [messages.length, onHasMessages])

  // Listen for Ctrl+C to cancel request
  useInput((input: string, key: Key) => {
    if (key.ctrl && input === 'c' && isLoading) {
      // Cancel current AI request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setIsLoading(false)
      
      // Remove streaming message
      setMessages((prev) => {
        const filtered = prev.filter(msg => !msg.isStreaming)
        return [...filtered, createMessage('system', 'Request cancelled')]
      })
    }
  }, { isActive: isLoading })

  // Initialize all AI Providers
  useEffect(() => {
    // Prevent duplicate initialization in strict mode
    if (initRef.current) return
    initRef.current = true

    const init = async () => {
      const configs = await initializeAllProviders()

      if (configs.length === 0) {
        // Show error message if initialization fails
        setMessages([createMessage('system',
          'Failed to initialize AI provider. Please check your environment variables (.env file) and make sure you have set a valid API key.'
        )])
        return
      }

      setAiConfigs(configs)

      // 从配置文件读取上次选择的提供商
      const savedDefaultProvider = getDefaultProvider()

      // 查找匹配的配置
      let selectedConfig = configs.find(c => c.providerId === savedDefaultProvider)

      // 如果没有找到，使用第一个
      if (!selectedConfig) {
        selectedConfig = configs[0]
      }

      setCurrentConfig(selectedConfig)

      // 通知父组件当前provider
      if (onProviderSwitch && selectedConfig) {
        onProviderSwitch(selectedConfig.providerId, configs)
      }
    }
    init()
  }, [onProviderSwitch])

  // Real AI streaming response
  const streamAIResponse = useCallback(async (conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) => {
    if (!currentConfig) {
      setMessages((prev) => [...prev, createMessage('system',
        'AI provider is not initialized. Cannot generate response.'
      )])
      setIsLoading(false)
      return
    }

    // Create new AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const aiMessage = createMessage('assistant', '', { isStreaming: true })
    const aiMessageId = aiMessage.id

    setMessages((prev) => [...prev, aiMessage])

    try {
      // Use real AI streaming response
      for await (const chunk of streamAIChat(conversationHistory, currentConfig)) {
        // Check if cancelled
        if (abortController.signal.aborted) {
          break
        }

        setMessages((prev) => {
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

      // If cancelled, don't update final state
      if (abortController.signal.aborted) {
        return
      }

      // Streaming complete, update state
      setMessages((prev) => {
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
      // If cancelled, don't show error
      if (abortController.signal.aborted) {
        return
      }

      // Handle error
      setMessages((prev) => [...prev, createMessage('system',
        `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      )])
    } finally {
      abortControllerRef.current = null
      setIsLoading(false)
    }
  }, [currentConfig])

  // 切换提供商
  const switchProvider = useCallback((providerId: ProviderId) => {
    const targetConfig = aiConfigs.find(c => c.providerId === providerId)

    if (!targetConfig) {
      setMessages((prev) => [...prev, createMessage('system',
        `Provider "${providerId}" not found or not initialized.`
      )])
      return false
    }

    setCurrentConfig(targetConfig)
    setDefaultProvider(providerId, targetConfig.model)

    setMessages((prev) => [...prev, createMessage('system',
      `Switched to ${targetConfig.providerId} provider (model: ${targetConfig.model})`
    )])

    // 通知父组件
    if (onProviderSwitch) {
      onProviderSwitch(providerId, aiConfigs)
    }

    return true
  }, [aiConfigs, onProviderSwitch])

  // 暴露 switchProvider 方法给父组件
  useEffect(() => {
    // 将 switchProvider 方法挂载到全局，供命令系统调用
    // 使用 globalThis 代替 window，兼容 Node.js 环境
    ;(globalThis as any).__switchProvider = switchProvider
    return () => {
      delete (globalThis as any).__switchProvider
    }
  }, [switchProvider])

  const handleSendMessage = useCallback((content: string, showGoodbyeMessage?: string) => {
    // If there's a goodbye message, show it
    if (showGoodbyeMessage) {
      setMessages((prev) => [...prev, createMessage('system', showGoodbyeMessage)])
      return
    }
    
    // Check if it's an unknown command
    if (isCommand(content)) {
      // Special handling for clear command
      const { command } = parseCommand(content)
      if (command === 'clear') {
        // Use Ink's render instance clear method
        const instance = getRenderInstance()
        if (instance) {
          instance.clear()
        }
        // Clear chat messages
        setMessages([])
        return
      }

      setMessages((prev) => [...prev, createMessage('system', 
        `Unknown command: ${content}. Type / to see available commands.`
      )])
      return
    }

    // Add user message
    setMessages((prev) => [...prev, createMessage('user', content)])
    setIsLoading(true)

    // Build conversation history (including new message)
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

    // Call real AI response
    streamAIResponse(conversationHistory)
  }, [messages, streamAIResponse])

  return (
    <Box flexDirection="column" padding={1}>
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        commandRegistry={commandRegistry}
        onShowGoodbyeMessage={onShowGoodbyeMessage}
        provider={currentConfig?.providerId}
        model={currentConfig?.model}
      />
    </Box>
  )
}

export default ChatDemo
