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
