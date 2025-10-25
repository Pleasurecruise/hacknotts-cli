import path from 'node:path'
import { promises as fs } from 'node:fs'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

const DEFAULT_MAX_BYTES = 128 * 1024

const ReadFileParamsSchema = z.object({
  absolute_path: z
    .string()
    .min(1, "The 'absolute_path' parameter must be non-empty.")
    .describe('Absolute path to the file to read. Relative paths are not supported.'),
  offset: z
    .number()
    .int()
    .min(0, 'Offset must be a non-negative number.')
    .optional()
    .describe('Optional 0-based line number to start reading from. Use with limit to paginate.'),
  limit: z
    .number()
    .int()
    .positive('Limit must be a positive number.')
    .optional()
    .describe('Optional number of lines to read. Use with offset to paginate.')
})

const ReadFileOutputSchema = z.object({
  absolutePath: z.string(),
  encoding: z.enum(['utf8', 'base64']),
  bytesRead: z.number().int().nonnegative(),
  totalBytes: z.number().int().nonnegative(),
  truncated: z.boolean(),
  lines: z
    .object({
      start: z.number().int().nonnegative(),
      end: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
      nextOffset: z.number().int().nonnegative().optional()
    })
    .optional()
})

export type ReadFileToolParams = z.infer<typeof ReadFileParamsSchema>

export interface RegisterReadFileToolOptions {
  /**
   * Maximum number of bytes to read when returning a preview of the file.
   * Defaults to 128 KiB.
   */
  maxBytes?: number
  /**
   * Optional list of directory roots a file must be contained in.
   * If omitted, any absolute path is allowed.
   */
  allowedRoots?: string[]
  /**
   * Preferred text encoding when reading files.
   * Defaults to UTF-8.
   */
  encoding?: BufferEncoding
}

interface FileReadResult {
  content: string
  structuredContent: z.infer<typeof ReadFileOutputSchema>
  truncated: boolean
  bytesRead: number
}

export function registerReadFileTool(
  server: McpServer,
  options: RegisterReadFileToolOptions = {}
): RegisteredTool {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const encoding = options.encoding ?? 'utf8'
  const allowedRoots = (options.allowedRoots ?? []).map((root) => path.resolve(root))

  return server.registerTool(
    'read_file',
    {
      title: 'Read File',
      description:
        "Reads and returns the content of a specified file. Supports optional pagination via 'offset' and 'limit'. " +
        'Binary files are returned as base64 data.',
      inputSchema: ReadFileParamsSchema.shape,
      outputSchema: ReadFileOutputSchema.shape,
      annotations: {
        title: 'Read file',
        readOnlyHint: true,
        destructiveHint: false
      }
    },
    async (params) => {
      const validation = ReadFileParamsSchema.safeParse(params)
      if (!validation.success) {
        throw new Error(validation.error.errors.map((err) => err.message).join('; '))
      }

      const { absolute_path, offset, limit } = validation.data
      const resolvedPath = path.resolve(absolute_path)

      if (!path.isAbsolute(absolute_path)) {
        throw new Error(`File path must be absolute, but was relative: ${absolute_path}`)
      }

      ensureWithinAllowedRoots(resolvedPath, allowedRoots)

      const stats = await fs.stat(resolvedPath).catch((error: unknown) => {
        if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
          throw new Error(`File not found: ${resolvedPath}`)
        }
        throw error
      })

      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${resolvedPath}`)
      }

      if (limit !== undefined && limit <= 0) {
        throw new Error('Limit must be a positive number.')
      }

      if (offset !== undefined && offset < 0) {
        throw new Error('Offset must be a non-negative number.')
      }

  const readResult =
    offset !== undefined || limit !== undefined
      ? await readFileByLines(resolvedPath, stats.size, {
          encoding,
          offset: offset ?? 0,
          limit
        })
      : await readFilePreview(resolvedPath, stats.size, {
          encoding,
          maxBytes
        })

  return buildToolResult(readResult)
    }
  )
}

function ensureWithinAllowedRoots(resolvedPath: string, roots: string[]): void {
  if (roots.length === 0) {
    return
  }

  const isWithinRoot = roots.some((root) => {
    const relative = path.relative(root, resolvedPath)
    return !relative.startsWith('..') && !path.isAbsolute(relative)
  })

  if (!isWithinRoot) {
    throw new Error(
      `File path must be within one of the allowed directories: ${roots.join(', ')}`
    )
  }
}

async function readFilePreview(
  filePath: string,
  totalBytes: number,
  options: { maxBytes: number; encoding: BufferEncoding }
): Promise<FileReadResult> {
  const toRead = Math.min(totalBytes, options.maxBytes)
  const handle = await fs.open(filePath, 'r')
  try {
    const buffer = Buffer.allocUnsafe(toRead)
    const { bytesRead } = await handle.read(buffer, 0, toRead, 0)
    const previewBuffer = buffer.subarray(0, bytesRead)

    const { text, isBinary } = decodeBuffer(previewBuffer, options.encoding)

    const truncated = totalBytes > bytesRead

    const content = isBinary
      ? createBinaryMessage(filePath, previewBuffer, totalBytes, truncated)
      : truncated
        ? createTruncatedMessage({
            filePath,
            totalBytes,
            bytesRead,
            body: text
          })
        : text

    return {
      content,
      bytesRead,
      truncated,
      structuredContent: {
        absolutePath: filePath,
        encoding: isBinary ? 'base64' : 'utf8',
        bytesRead,
        totalBytes,
        truncated
      }
    }
  } finally {
    await handle.close()
  }
}

async function readFileByLines(
  filePath: string,
  totalBytes: number,
  options: { offset: number; limit?: number; encoding: BufferEncoding }
): Promise<FileReadResult> {
  const fileBuffer = await fs.readFile(filePath)
  const bytesRead = fileBuffer.length
  const { text, isBinary } = decodeBuffer(fileBuffer, options.encoding)

  if (isBinary) {
    return {
      content: createBinaryMessage(filePath, fileBuffer, totalBytes, totalBytes > bytesRead),
      bytesRead,
      truncated: totalBytes > bytesRead,
      structuredContent: {
        absolutePath: filePath,
        encoding: 'base64',
        bytesRead,
        totalBytes,
        truncated: totalBytes > bytesRead
      }
    }
  }

  const lines = splitLines(text)
  const totalLines = lines.length

  if (totalLines === 0 && options.offset > 0) {
    throw new Error(`Offset ${options.offset} exceeds file line count of 0.`)
  }

  if (totalLines > 0 && options.offset >= totalLines) {
    throw new Error(
      `Offset ${options.offset} exceeds file line count of ${totalLines}. Maximum allowed offset is ${
        totalLines - 1
      }.`
    )
  }

  const start = Math.max(0, Math.min(options.offset, totalLines === 0 ? 0 : totalLines - 1))
  const end = options.limit ? Math.min(start + options.limit, totalLines) : totalLines
  const preview = lines.slice(start, end).join('\n')

  const truncated = start > 0 || end < totalLines

  const content = truncated
    ? createTruncatedMessage({
        filePath,
        totalBytes,
        bytesRead,
        body: preview,
        startLine: start,
        endLine: Math.max(end - 1, start),
        totalLines: lines.length,
        nextOffset: end < lines.length ? end : undefined
      })
    : preview

  return {
    content,
    bytesRead,
    truncated,
    structuredContent: {
      absolutePath: filePath,
      encoding: 'utf8',
      bytesRead,
      totalBytes,
      truncated,
      lines: {
        start,
        end: end === 0 ? 0 : Math.max(end - 1, start),
        total: totalLines,
        nextOffset: end < totalLines ? end : undefined
      }
    }
  }
}

function decodeBuffer(
  buffer: Buffer,
  encoding: BufferEncoding
): { text: string; isBinary: boolean } {
  if (buffer.length === 0) {
    return { text: '', isBinary: false }
  }

  const text = buffer.toString(encoding)
  const containsNull = buffer.includes(0)
  const hasReplacement = text.includes('\uFFFD')
  const nonPrintableRatio = calculateNonPrintableRatio(buffer)

  const isBinary = containsNull || hasReplacement || nonPrintableRatio > 0.3

  return { text, isBinary }
}

function calculateNonPrintableRatio(buffer: Buffer): number {
  if (buffer.length === 0) {
    return 0
  }

  let nonPrintable = 0

  for (const byte of buffer) {
    // Allow common control characters: tab(9), line feed(10), carriage return(13)
    if (byte === 9 || byte === 10 || byte === 13) {
      continue
    }
    if (byte < 32 || byte === 127) {
      nonPrintable++
    }
  }

  return nonPrintable / buffer.length
}

function splitLines(text: string): string[] {
  if (text === '') {
    return []
  }

  return text.split(/\r?\n/)
}

function createTruncatedMessage(options: {
  filePath: string
  totalBytes: number
  bytesRead: number
  body: string
  startLine?: number
  endLine?: number
  totalLines?: number
  nextOffset?: number
}): string {
  const relativePath = shortenPath(options.filePath)

  const linesInfo =
    options.totalLines !== undefined &&
    options.startLine !== undefined &&
    options.endLine !== undefined &&
    options.totalLines > 0
      ? `Status: Showing lines ${options.startLine + 1}-${options.endLine + 1} of ${options.totalLines} total lines.\n` +
        (options.nextOffset !== undefined
          ? `Action: To read more, call again with offset: ${options.nextOffset}.\n`
          : '')
      : ''

  return [
    'IMPORTANT: The file content has been truncated.',
    `File: ${relativePath}`,
    `Size: showing ${options.bytesRead} of ${options.totalBytes} bytes.`,
    linesInfo.trim(),
    '',
    '--- FILE CONTENT (truncated) ---',
    options.body
  ]
    .filter(Boolean)
    .join('\n')
}

function createBinaryMessage(
  filePath: string,
  buffer: Buffer,
  totalBytes: number,
  truncated: boolean
): string {
  const relativePath = shortenPath(filePath)
  const base64 = buffer.toString('base64')
  const header = truncated
    ? `Showing first ${buffer.length} of ${totalBytes} bytes (base64)`
    : `Total bytes: ${buffer.length} (base64)`

  return [
    `Binary file preview: ${relativePath}`,
    header,
    '',
    '--- FILE CONTENT (base64 encoded) ---',
    base64
  ].join('\n')
}

function shortenPath(absolutePath: string): string {
  const relative = path.relative(process.cwd(), absolutePath)
  if (relative === '') {
    return '.'
  }
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return absolutePath
  }
  return `${'.'}${path.sep}${relative}`
}

function buildToolResult(result: FileReadResult): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: result.content
      }
    ],
    structuredContent: result.structuredContent
  }
}
