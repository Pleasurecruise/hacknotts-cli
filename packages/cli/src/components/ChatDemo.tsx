import { useState, useEffect, useCallback, useRef } from 'react'
import { Box } from 'ink'
import ChatInterface, { type Message } from './ChatInterface'
import type { CommandRegistry } from '../commands/types'
import { initializeAIProvider, streamAIChat, type AIConfig } from '../services/aiService'
import { createMessage, isCommand, parseCommand } from '../utils/helpers'

type ChatDemoProps = {
  commandRegistry?: CommandRegistry
  onShowGoodbyeMessage?: (message: string) => void
  onHasMessages?: (hasMessages: boolean) => void
}

export const ChatDemo = ({ commandRegistry, onShowGoodbyeMessage, onHasMessages }: ChatDemoProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)
  const initRef = useRef(false) // 防止重复初始化

  // 通知父组件消息状态变化
  useEffect(() => {
    onHasMessages?.(messages.length > 0)
  }, [messages.length, onHasMessages])

  // 初始化 AI Provider
  useEffect(() => {
    // 防止严格模式下的重复初始化
    if (initRef.current) return
    initRef.current = true

    const init = async () => {
      const config = await initializeAIProvider()
      if (config) {
        setAiConfig(config)
      } else {
        // 如果初始化失败，显示错误消息
        setMessages([createMessage('system', 
          'Failed to initialize AI provider. Please check your environment variables (.env file) and make sure you have set a valid API key.'
        )])
      }
    }
    init()
  }, [])

  // 真实 AI 流式响应
  const streamAIResponse = useCallback(async (conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) => {
    if (!aiConfig) {
      setMessages((prev) => [...prev, createMessage('system', 
        'AI provider is not initialized. Cannot generate response.'
      )])
      setIsLoading(false)
      return
    }

    const aiMessage = createMessage('assistant', '', { isStreaming: true })
    const aiMessageId = aiMessage.id

    setMessages((prev) => [...prev, aiMessage])

    try {
      // 使用真实的 AI 流式响应
      for await (const chunk of streamAIChat(conversationHistory, aiConfig)) {
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

      // 流式完成，更新状态
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
      // 处理错误
      setMessages((prev) => [...prev, createMessage('system',
        `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      )])
    }

    setIsLoading(false)
  }, [aiConfig])

  const handleSendMessage = useCallback((content: string, showGoodbyeMessage?: string) => {
    // 如果有告别消息，显示它
    if (showGoodbyeMessage) {
      setMessages((prev) => [...prev, createMessage('system', showGoodbyeMessage)])
      return
    }
    
    // 检查是否是未知命令
    if (isCommand(content)) {
      // 特殊处理 clear 命令
      const { command } = parseCommand(content)
      if (command === 'clear') {
        setMessages([])
        return
      }

      setMessages((prev) => [...prev, createMessage('system', 
        `Unknown command: ${content}. Type / to see available commands.`
      )])
      return
    }

    // 添加用户消息
    setMessages((prev) => [...prev, createMessage('user', content)])
    setIsLoading(true)

    // 构建对话历史（包含新消息）
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

    // 调用真实 AI 响应
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
      />
    </Box>
  )
}

export default ChatDemo
