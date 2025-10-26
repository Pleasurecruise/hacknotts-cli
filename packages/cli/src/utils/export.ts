/**
 * Export utilities for saving chat history
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Message } from '../components/ChatInterface'

export type ExportFormat = 'json' | 'md' | 'markdown'

/**
 * Generate filename with timestamp
 */
function generateFilename(format: ExportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const ext = format === 'json' ? 'json' : 'md'
  return `chat-export-${timestamp}.${ext}`
}

/**
 * Export messages to JSON format
 * Following OpenAI chat completion format for compatibility
 */
function exportToJSON(messages: Message[]): string {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    messageCount: messages.length,
    messages: messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    }))
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Export messages to Markdown format
 * Using --- separator with role comments
 */
function exportToMarkdown(messages: Message[]): string {
  const lines: string[] = []
  
  // Header
  lines.push('# Chat History Export')
  lines.push('')
  lines.push(`**Exported at:** ${new Date().toLocaleString()}`)
  lines.push(`**Total messages:** ${messages.length}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  
  // Messages
  for (const msg of messages) {
    // Role comment
    lines.push(`<!-- role: ${msg.role} -->`)
    lines.push(`<!-- timestamp: ${msg.timestamp.toISOString()} -->`)
    lines.push('')
    
    // Content
    if (msg.role === 'user') {
      lines.push('## 👤 User')
    } else if (msg.role === 'assistant') {
      lines.push('## 🤖 Assistant')
    } else {
      lines.push('## 🔧 System')
    }
    lines.push('')
    lines.push(msg.content)
    lines.push('')
    lines.push('---')
    lines.push('')
  }
  
  return lines.join('\n')
}

/**
 * Export chat messages to file
 */
export function exportMessages(
  messages: Message[],
  format: ExportFormat,
  outputDir: string = process.cwd()
): { success: boolean; filename?: string; error?: string } {
  try {
    if (messages.length === 0) {
      return {
        success: false,
        error: 'No messages to export'
      }
    }
    
    const filename = generateFilename(format)
    const filepath = join(outputDir, filename)
    
    let content: string
    if (format === 'json') {
      content = exportToJSON(messages)
    } else {
      content = exportToMarkdown(messages)
    }
    
    writeFileSync(filepath, content, 'utf-8')
    
    return {
      success: true,
      filename: filepath
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Parse export format from command argument
 */
export function parseExportFormat(arg: string | undefined): ExportFormat {
  if (!arg) {
    return 'json' // default format
  }
  
  const normalized = arg.toLowerCase().trim()
  
  if (normalized === 'md' || normalized === 'markdown') {
    return 'md'
  }
  
  if (normalized === 'json') {
    return 'json'
  }
  
  // Default to json for unknown formats
  return 'json'
}
