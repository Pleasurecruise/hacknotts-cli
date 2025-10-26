/**
 * Built-in Filesystem Tool
 * Simplified implementation for direct integration
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { existsSync, statSync } from 'fs'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface FilesystemToolConfig {
  allowedDirectories?: string[]
  maxFileSize?: number
}

/**
 * Filesystem tool definition (MCP compatible)
 */
export const filesystemToolDefinition: Tool = {
  name: 'filesystem',
  description:
    'Use this tool for file system operations. Call this when the user needs to read files, write files, list directory contents, create directories, or get file information. DO NOT use this for general questions - only use when file system access is explicitly needed.',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: [
          'read_file',
          'write_file',
          'list_directory',
          'create_directory',
          'get_file_info',
          'read_multiple_files'
        ],
        description: 'The filesystem operation to perform'
      },
      path: {
        type: 'string',
        description: 'The file or directory path (required for most operations)'
      },
      paths: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of file paths (used for read_multiple_files operation)'
      },
      content: {
        type: 'string',
        description: 'File content (required for write_file operation)'
      },
      head: {
        type: 'number',
        description: 'Number of lines to read from the beginning (for read_file)'
      },
      tail: {
        type: 'number',
        description: 'Number of lines to read from the end (for read_file)'
      }
    },
    required: ['operation']
  }
}

/**
 * Filesystem tool implementation
 */
export async function executeFilesystemTool(
  args: {
    operation: string
    path?: string
    paths?: string[]
    content?: string
    head?: number
    tail?: number
  },
  config: FilesystemToolConfig = {}
): Promise<any> {
  const { allowedDirectories = [], maxFileSize = 10 * 1024 * 1024 } = config // 10MB default

  const { operation, path: filePath, paths, content, head, tail } = args

  // Validate operation
  if (!operation) {
    throw new Error('Operation is required')
  }

  // Check if path is within allowed directories (if configured)
  const checkAllowedPath = (checkPath: string) => {
    if (allowedDirectories.length > 0) {
      const absolutePath = path.resolve(checkPath)
      const isAllowed = allowedDirectories.some((allowedDir) => {
        const absAllowedDir = path.resolve(allowedDir)
        return absolutePath.startsWith(absAllowedDir)
      })

      if (!isAllowed) {
        throw new Error(`Access denied: Path ${checkPath} is not in allowed directories`)
      }
    }
  }

  try {
    switch (operation) {
      case 'read_file': {
        if (!filePath) {
          throw new Error('path is required for read_file operation')
        }

        checkAllowedPath(filePath)

        // Check file size
        if (existsSync(filePath)) {
          const stats = statSync(filePath)
          if (stats.size > maxFileSize) {
            throw new Error(
              `File too large: ${stats.size} bytes (max: ${maxFileSize} bytes)`
            )
          }
        }

        const fileContent = await fs.readFile(filePath, 'utf-8')

        // Handle head/tail options
        let finalContent = fileContent
        if (head !== undefined || tail !== undefined) {
          const lines = fileContent.split('\n')
          if (head !== undefined) {
            finalContent = lines.slice(0, head).join('\n')
          } else if (tail !== undefined) {
            finalContent = lines.slice(-tail).join('\n')
          }
        }

        return {
          success: true,
          operation: 'read_file',
          path: filePath,
          content: finalContent,
          size: fileContent.length
        }
      }

      case 'read_multiple_files': {
        if (!paths || paths.length === 0) {
          throw new Error('paths array is required for read_multiple_files operation')
        }

        // Validate all paths
        paths.forEach((p) => checkAllowedPath(p))

        const results = await Promise.all(
          paths.map(async (p) => {
            try {
              // Check file size
              if (existsSync(p)) {
                const stats = statSync(p)
                if (stats.size > maxFileSize) {
                  return {
                    path: p,
                    success: false,
                    error: `File too large: ${stats.size} bytes (max: ${maxFileSize} bytes)`
                  }
                }
              }

              const content = await fs.readFile(p, 'utf-8')
              return {
                path: p,
                success: true,
                content,
                size: content.length
              }
            } catch (error) {
              return {
                path: p,
                success: false,
                error: error instanceof Error ? error.message : String(error)
              }
            }
          })
        )

        return {
          success: true,
          operation: 'read_multiple_files',
          results
        }
      }

      case 'write_file': {
        if (!filePath) {
          throw new Error('path is required for write_file operation')
        }
        if (content === undefined) {
          throw new Error('content is required for write_file operation')
        }

        checkAllowedPath(filePath)

        // Ensure directory exists
        const dir = path.dirname(filePath)
        await fs.mkdir(dir, { recursive: true })

        await fs.writeFile(filePath, content, 'utf-8')

        return {
          success: true,
          operation: 'write_file',
          path: filePath,
          size: content.length
        }
      }

      case 'list_directory': {
        if (!filePath) {
          throw new Error('path is required for list_directory operation')
        }

        checkAllowedPath(filePath)

        const entries = await fs.readdir(filePath, { withFileTypes: true })

        const items = entries.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: path.join(filePath, entry.name)
        }))

        return {
          success: true,
          operation: 'list_directory',
          path: filePath,
          items
        }
      }

      case 'create_directory': {
        if (!filePath) {
          throw new Error('path is required for create_directory operation')
        }

        checkAllowedPath(filePath)

        await fs.mkdir(filePath, { recursive: true })

        return {
          success: true,
          operation: 'create_directory',
          path: filePath
        }
      }

      case 'get_file_info': {
        if (!filePath) {
          throw new Error('path is required for get_file_info operation')
        }

        checkAllowedPath(filePath)

        const stats = await fs.stat(filePath)

        return {
          success: true,
          operation: 'get_file_info',
          path: filePath,
          info: {
            size: stats.size,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime
          }
        }
      }

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      operation,
      path: filePath,
      error: errorMessage
    }
  }
}
