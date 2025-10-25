import type { Command } from './types'
import { GOODBYE_MESSAGES, EXIT_DELAY } from '../utils/constants'
import { randomChoice } from '../utils/helpers'

export const createProviderCommand = (onExecute: () => void): Command => ({
  name: 'provider',
  description: '🔌 Display AI provider status and configuration info',
  aliases: ['providers', 'p'],
  execute: () => {
    onExecute()
  }
})

export const createHelpCommand = (getAllCommands: () => Command[]): Command => ({
  name: 'help',
  description: '❓ Show all available commands and usage tips',
  aliases: ['h', '?'],
  execute: () => {
    // 这个命令的执行会在 ChatInterface 中特殊处理
    // 因为需要显示命令列表UI
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
