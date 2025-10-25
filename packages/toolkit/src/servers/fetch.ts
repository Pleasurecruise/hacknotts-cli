/**
 * Built-in Fetch MCP Server
 * Provides web content fetching capabilities
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool
} from '@modelcontextprotocol/sdk/types.js'

export interface FetchServerConfig {
  name?: string
  userAgent?: string
  maxContentLength?: number
  timeout?: number
}

/**
 * Create a built-in fetch MCP server
 */
export function createFetchServer(config: FetchServerConfig = {}) {
  const {
    name = 'fetch',
    userAgent = 'MCP-Fetch-Client/1.0',
    maxContentLength = 50000,
    timeout = 10000
  } = config

  const server = new Server(
    {
      name: `builtin-${name}`,
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  )

  // Define the fetch tool
  const fetchTool: Tool = {
    name: 'fetch',
    description:
      'Fetches a URL from the internet and returns its content. Can handle HTML, JSON, and plain text responses.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch (must be a valid HTTP/HTTPS URL)'
        },
        options: {
          type: 'object',
          description: 'Optional fetch options',
          properties: {
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE'],
              description: 'HTTP method to use',
              default: 'GET'
            },
            headers: {
              type: 'object',
              description: 'Additional headers to send with the request',
              additionalProperties: {
                type: 'string'
              }
            }
          }
        }
      },
      required: ['url']
    }
  }

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [fetchTool]
    }
  })

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'fetch') {
      throw new Error(`Unknown tool: ${request.params.name}`)
    }

    const { url, options = {} } = request.params.arguments as {
      url: string
      options?: {
        method?: string
        headers?: Record<string, string>
      }
    }

    if (!url) {
      throw new Error('URL is required')
    }

    // Validate URL
    try {
      new URL(url)
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`)
    }

    try {
      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers: {
          'User-Agent': userAgent,
          ...options.headers
        },
        signal: AbortSignal.timeout(timeout)
      }

      // Perform the fetch
      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Get content type
      const contentType = response.headers.get('content-type') || ''

      // Read response based on content type
      let content: string
      let metadata: Record<string, any> = {
        status: response.status,
        statusText: response.statusText,
        contentType,
        url: response.url
      }

      if (contentType.includes('application/json')) {
        const json = await response.json()
        content = JSON.stringify(json, null, 2)
        metadata.type = 'json'
      } else if (contentType.includes('text/html')) {
        const html = await response.text()
        // Simple HTML to text conversion (basic implementation)
        content = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        metadata.type = 'html'
      } else {
        content = await response.text()
        metadata.type = 'text'
      }

      // Truncate if too long
      if (content.length > maxContentLength) {
        content = content.slice(0, maxContentLength) + '\n\n[Content truncated...]'
        metadata.truncated = true
      }

      const result: CallToolResult = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                metadata,
                content
              },
              null,
              2
            )
          }
        ]
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      const result: CallToolResult = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: errorMessage,
                url
              },
              null,
              2
            )
          }
        ],
        isError: true
      }

      return result
    }
  })

  return server
}

/**
 * Create and start a fetch server with stdio transport
 * This is useful for running as a standalone MCP server
 */
export async function startFetchServer(config?: FetchServerConfig) {
  const server = createFetchServer(config)
  const transport = new StdioServerTransport()
  await server.connect(transport)
  return server
}
