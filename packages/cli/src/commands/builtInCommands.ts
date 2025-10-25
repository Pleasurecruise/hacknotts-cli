import type { Command } from './types'

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
    // 显示告别消息 - HackNotts themed!
    if (showGoodbyeMessage) {
      const goodbyeMessages = [
        '👋 Goodbye! Thanks for using HackNotts CLI! Keep hacking with playful cleverness!',
        '✨ See you at HackNotts 2025! Build something amazing!',
        '🌟 Farewell, hacker! May your code compile and your ideas flourish!',
        '💫 Until next time! Remember: every expert was once a beginner.',
        '🎉 Happy coding! See you at the University of Nottingham!',
        '🚀 Off you go! Time to turn those ideas into reality!',
        '🏆 Keep learning, keep building! HackNotts believes in you!',
        '💡 Goodbye! Don\'t forget: code is poetry, and you\'re the poet!'
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
