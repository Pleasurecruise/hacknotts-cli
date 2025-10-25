import { useState, useEffect } from 'react'
import { Box, useApp } from 'ink'
import ChatInterface, { type Message } from './ChatInterface'
import type { CommandRegistry } from '../commands/types'
import { initializeAIProvider, streamAIChat, type AIConfig } from '../services/aiService'

type ChatDemoProps = {
  commandRegistry?: CommandRegistry
}

export const ChatDemo = ({ commandRegistry }: ChatDemoProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)
  const { exit } = useApp()

  // 初始化 AI Provider
  useEffect(() => {
    const init = async () => {
      const config = await initializeAIProvider()
      if (config) {
        setAiConfig(config)
      } else {
        // 如果初始化失败，显示错误消息
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'system',
          content: 'Failed to initialize AI provider. Please check your environment variables (.env file) and make sure you have set a valid API key.',
          timestamp: new Date(),
        }
        setMessages([errorMessage])
      }
    }
    init()
  }, [])

  // 真实 AI 流式响应
  const streamAIResponse = async (conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) => {
    if (!aiConfig) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: 'AI provider is not initialized. Cannot generate response.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setIsLoading(false)
      return
    }

    const aiMessageId = Date.now().toString() + '-ai'

    // 创建初始的 AI 消息
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, aiMessage])

    try {
      // 使用真实的 AI 流式响应
      for await (const chunk of streamAIChat(conversationHistory, aiConfig)) {
        setMessages((prev) => {
          const updated = [...prev]
          const lastMessage = updated[updated.length - 1]
          if (lastMessage && lastMessage.id === aiMessageId) {
            lastMessage.content += chunk
          }
          return updated
        })
      }

      // 流式完成，更新状态
      setMessages((prev) => {
        const updated = [...prev]
        const lastMessage = updated[updated.length - 1]
        if (lastMessage && lastMessage.id === aiMessageId) {
          lastMessage.isStreaming = false
        }
        return updated
      })
    } catch (error) {
      // 处理错误
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }

    setIsLoading(false)
  }

  const handleSendMessage = (content: string) => {
    // 检查是否是未知命令
    if (content.startsWith('/')) {
      // 特殊处理 clear 命令
      if (content.trim() === '/clear') {
        setMessages([])
        return
      }

      const systemMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `Unknown command: ${content}. Type / to see available commands.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, systemMessage])
      return
    }

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
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
  }

  return (
    <Box flexDirection="column" padding={1}>
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        commandRegistry={commandRegistry}
      />
    </Box>
  )
}

export default ChatDemo
