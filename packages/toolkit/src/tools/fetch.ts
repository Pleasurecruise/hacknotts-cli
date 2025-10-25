/**
 * Built-in Fetch Tool
 * Simplified implementation for direct integration
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export interface FetchToolConfig {
  userAgent?: string
  maxContentLength?: number
  timeout?: number
}

/**
 * Fetch tool definition (MCP compatible)
 */
export const fetchToolDefinition: Tool = {
  name: 'fetch',
  description:
    'Use this tool to fetch content from the internet. Call this when the user asks for current information, news, web pages, API data, or any online content. Supports fetching HTML, JSON, and plain text from any HTTP/HTTPS URL.',
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

/**
 * Fetch tool implementation
 */
export async function executeFetchTool(
  args: {
    url: string
    options?: {
      method?: string
      headers?: Record<string, string>
    }
  },
  config: FetchToolConfig = {}
): Promise<any> {
  const {
    userAgent = 'MCP-Fetch-Client/1.0',
    maxContentLength = 50000,
    timeout = 30000  // 增加到 30 秒
  } = config

  const { url, options = {} } = args

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

    return {
      success: true,
      metadata,
      content
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      error: errorMessage,
      url
    }
  }
}
