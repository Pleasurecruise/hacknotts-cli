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
  const initRef = useRef(false) // Prevent duplicate initialization
  const abortControllerRef = useRef<AbortController | null>(null) // For request cancellation

  // Notify parent component of message state changes
  useEffect(() => {
    onHasMessages?.(messages.length > 0)
  }, [messages.length, onHasMessages])

  // Initialize AI Provider
  useEffect(() => {
    // Prevent duplicate initialization in strict mode
    if (initRef.current) return
    initRef.current = true

    const init = async () => {
      const config = await initializeAIProvider()
      if (config) {
        setAiConfig(config)
      } else {
        // Show error message if initialization fails
        setMessages([createMessage('system', 
          'Failed to initialize AI provider. Please check your environment variables (.env file) and make sure you have set a valid API key.'
        )])
      }
    }
    init()
  }, [])

  // Real AI streaming response
  const streamAIResponse = useCallback(async (conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) => {
    if (!aiConfig) {
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
      for await (const chunk of streamAIChat(conversationHistory, aiConfig)) {
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
  }, [aiConfig])

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
        // Clear terminal screen
        process.stdout.write('\x1Bc')
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
        provider={aiConfig?.providerId}
        model={aiConfig?.model}
      />
    </Box>
  )
}

export default ChatDemo
