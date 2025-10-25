import type { Command } from './types'

export const createProviderCommand = (onExecute: () => void): Command => ({
  name: 'provider',
  description: 'Display the provider status view',
  aliases: ['providers', 'p'],
  execute: () => {
    onExecute()
  }
})

export const createHelpCommand = (getAllCommands: () => Command[]): Command => ({
  name: 'help',
  description: 'Show all available commands',
  aliases: ['h', '?'],
  execute: () => {
    // 这个命令的执行会在 ChatInterface 中特殊处理
    // 因为需要显示命令列表UI
  }
})

export const createClearCommand = (onExecute: () => void): Command => ({
  name: 'clear',
  description: 'Clear all chat messages and terminal output',
  aliases: ['cls', 'c'],
  execute: () => {
    onExecute()
  }
})

export const createExitCommand = (onExecute: () => void, showGoodbyeMessage?: (message: string) => void): Command => ({
  name: 'exit',
  description: 'Exit the application',
  aliases: ['quit', 'q'],
  execute: () => {
    // 显示告别消息
    if (showGoodbyeMessage) {
      const goodbyeMessages = [
        '👋 Goodbye! Thanks for using HackNotts CLI!',
        '✨ See you later! Have a great day!',
        '🌟 Farewell! Come back soon!',
        '💫 Bye! Happy coding!',
        '🎉 Take care! See you next time!'
      ]
      const randomMessage = goodbyeMessages[Math.floor(Math.random() * goodbyeMessages.length)]
      showGoodbyeMessage(randomMessage)
    }
    
    // 延迟退出以显示消息
    setTimeout(() => {
      onExecute()
    }, 800)
  }
})
