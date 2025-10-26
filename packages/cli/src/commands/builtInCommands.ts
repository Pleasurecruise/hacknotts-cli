import type { Command } from './types'
import { GOODBYE_MESSAGES, EXIT_DELAY } from '../utils/constants'
import { randomChoice } from '../utils/helpers'
import type { Message } from '../components/ChatInterface'
import { exportMessages, parseExportFormat } from '../utils/export'

export const createProviderCommand = (onExecute: () => void): Command => ({
  name: 'provider',
  description: '🔌 Display AI provider status and configuration info',
  aliases: ['providers', 'p'],
  execute: () => {
    onExecute()
  }
})

export const createHelpCommand = (onExecute: () => void): Command => ({
  name: 'help',
  description: '❓ Show all available commands and usage tips',
  aliases: ['h', '?'],
  execute: () => {
    // 执行回调以显示帮助视图
    onExecute()
  }
})

export const createClearCommand = (onExecute: () => void): Command => ({
  name: 'clear',
  description: '🧹 Clear all chat messages and start fresh',
  aliases: ['cls', 'c'],
  execute: () => {
    onExecute()
  }
})

export const createExitCommand = (onExecute: () => void, showGoodbyeMessage?: (message: string) => void): Command => ({
  name: 'exit',
  description: '👋 Exit the application (see you at HackNotts!)',
  aliases: ['quit', 'q'],
  execute: () => {
    // 显示随机告别消息
    if (showGoodbyeMessage) {
      showGoodbyeMessage(randomChoice(GOODBYE_MESSAGES))
    }

    // 延迟退出以显示消息
    setTimeout(() => {
      onExecute()
    }, EXIT_DELAY)
  }
})

export const createExportCommand = (
  getMessages: () => Message[],
  onSuccess?: (message: string) => void,
  onError?: (message: string) => void
): Command => ({
  name: 'export',
  description: '💾 Export chat history to file (usage: /export [json|md])',
  aliases: ['save', 'download'],
  execute: (args: string[]) => {
    const messages = getMessages()
    
    if (messages.length === 0) {
      if (onError) {
        onError('No messages to export. Start a conversation first!')
      }
      return
    }
    
    const format = parseExportFormat(args[0])
    const result = exportMessages(messages, format)
    
    if (result.success && result.filename) {
      if (onSuccess) {
        // 精简为一行：格式化文件路径为相对路径（如果在当前目录）
        const filename = result.filename.split(/[/\\]/).pop() || result.filename
        onSuccess(`Exported ${messages.length} message${messages.length > 1 ? 's' : ''} to ${filename} (${format.toUpperCase()})`)
      }
    } else {
      if (onError) {
        onError(`Export failed: ${result.error}`)
      }
    }
  }
})
