/**
 * 通用工具函数
 */
import type { Message } from '../components/ChatInterface'

/**
 * 从数组中随机选择一个元素
 */
export function randomChoice<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * 创建消息对象
 */
export function createMessage(
  role: Message['role'],
  content: string,
  options?: Partial<Pick<Message, 'isStreaming'>>
): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    role,
    content,
    timestamp: new Date(),
    ...options
  }
}

/**
 * 检查是否是命令输入
 */
export function isCommand(input: string): boolean {
  return input.trim().startsWith('/')
}

/**
 * 解析命令和参数
 */
export function parseCommand(input: string): { command: string; args: string[] } {
  const trimmed = input.trim().slice(1) // 移除前缀 /
  const parts = trimmed.split(/\s+/)
  return {
    command: parts[0].toLowerCase(),
    args: parts.slice(1)
  }
}

/**
 * 处理多字节字符的字符串操作（支持中文等）
 */
export class StringHelper {
  static toChars(str: string): string[] {
    return Array.from(str)
  }

  static insertAt(str: string, position: number, insertion: string): string {
    const chars = this.toChars(str)
    const beforeCursor = chars.slice(0, position)
    const afterCursor = chars.slice(position)
    const newChars = this.toChars(insertion)
    return [...beforeCursor, ...newChars, ...afterCursor].join('')
  }

  static deleteAt(str: string, position: number): string {
    const chars = this.toChars(str)
    if (position <= 0 || position > chars.length) return str
    return [...chars.slice(0, position - 1), ...chars.slice(position)].join('')
  }

  static getLength(str: string): number {
    return this.toChars(str).length
  }

  static substring(str: string, start: number, end?: number): string {
    const chars = this.toChars(str)
    return chars.slice(start, end).join('')
  }
}
