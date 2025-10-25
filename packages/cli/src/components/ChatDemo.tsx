import { useState } from 'react'
import { Box, useApp } from 'ink'
import ChatInterface, { type Message } from './ChatInterface'
import type { CommandRegistry } from '../commands/types'

type ChatDemoProps = {
  commandRegistry?: CommandRegistry
}

export const ChatDemo = ({ commandRegistry }: ChatDemoProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { exit } = useApp()

  // 模拟 AI 流式响应
  const simulateAIResponse = async (userMessage: string) => {
    const responses = [
      "Hello! I'm an AI assistant. How can I help you today?",
      "That's an interesting question! Let me think about it...",
      "I understand. Based on what you've told me, here's what I think:",
      "Great question! Here's my detailed response about that topic.",
      "I see what you're asking. Let me break this down for you step by step.",
    ]

    const response = responses[Math.floor(Math.random() * responses.length)]
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

    // 模拟流式输出
    const words = response.split(' ')
    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 100))
      
      setMessages((prev) => {
        const updated = [...prev]
        const lastMessage = updated[updated.length - 1]
        if (lastMessage && lastMessage.id === aiMessageId) {
          lastMessage.content = words.slice(0, i + 1).join(' ')
          lastMessage.isStreaming = i < words.length - 1
        }
        return updated
      })
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

    // 模拟 AI 响应
    setTimeout(() => {
      simulateAIResponse(content)
    }, 500)
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
