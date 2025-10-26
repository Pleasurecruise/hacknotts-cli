import type { Message } from '../components/ChatInterface'
import { EXIT_DELAY,GOODBYE_MESSAGES } from '../utils/constants'
import { exportMessages, parseExportFormat } from '../utils/export'
import { randomChoice } from '../utils/helpers'
import type { Command } from './types'

export const createProviderCommand = (onExecute: () => void): Command => ({
  name: 'provider',
  description: '🔌 Display AI provider status and configuration info',
  aliases: ['providers', 'p'],
  execute: () => {
    onExecute()
  }
})

export const createModelCommand = (
  onExecute: (modelName?: string) => void,
  onError?: (message: string) => void
): Command => ({
  name: 'model',
  description: '🤖 Switch to a specific model temporarily (usage: /model [model-name])',
  aliases: ['m'],
  execute: (args: string[]) => {
    if (args.length === 0) {
      // 如果没有参数，显示当前模型信息
      onExecute()
      return
    }

    const modelName = args.join(' ').trim()
    if (!modelName) {
      if (onError) {
        onError('Please specify a model name. Usage: /model <model-name>')
      }
      return
    }

    onExecute(modelName)
  }
})

export const createCdCommand = (
  onExecute: (directory?: string) => void,
  onError?: (message: string) => void
): Command => ({
  name: 'cd',
  description: '📁 Change working directory temporarily (usage: /cd [path])',
  aliases: ['chdir'],
  execute: (args: string[]) => {
    if (args.length === 0) {
      // 如果没有参数，显示当前工作目录
      onExecute()
      return
    }

    const directory = args.join(' ').trim()
    if (!directory) {
      if (onError) {
        onError('Please specify a directory path. Usage: /cd <path>')
      }
      return
    }

    onExecute(directory)
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

export const createInitCommand = (
  onSuccess?: (message: string) => void,
  onError?: (message: string) => void
): Command => ({
  name: 'init',
  description: '🚀 Initialize HACKNOTTS.md context file in current directory',
  aliases: ['initialize'],
  execute: async () => {
    try {
      const fs = await import('fs')
      const path = await import('path')

      const cwd = process.cwd()
      const filePath = path.join(cwd, 'HACKNOTTS.md')

      // 检查文件是否已存在
      if (fs.existsSync(filePath)) {
        if (onError) {
          onError('HACKNOTTS.md already exists in current directory')
        }
        return
      }

      const template = `# 🎯 HackNotts Project Context

## Project Overview
<!-- Describe your project here -->
This is a project written in JavaScript. Please provide a brief description of what you're building.

## Technology Stack
<!-- List the technologies you're using -->
- Language: 
- Framework: 
- Key Libraries: 

## Project Goals
<!-- What are you trying to achieve? -->
1. 
2. 
3. 

## Current Status
<!-- What have you completed and what's next? -->
### Completed
- 

### In Progress
- 

### TODO
- 

## Important Notes
<!-- Any important context or decisions -->
- 

## Team Members
<!-- Optional: List your team members -->
- 

---
*This file provides context for AI assistants to better understand your project.*
`

      fs.writeFileSync(filePath, template, 'utf-8')

      if (onSuccess) {
        onSuccess(`Created HACKNOTTS.md in ${cwd}`)
      }
    } catch (error) {
      if (onError) {
        onError(`Failed to create HACKNOTTS.md: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
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


export const createAboutCommand = (onExecute: () => void): Command => ({
  name: 'about',
  description: 'ℹ️  Show application information and credits',
  aliases: ['info'],
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
