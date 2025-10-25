/**
 * MCP Tool Utilities
 * Convert MCP tools to AI SDK format and handle tool invocations
 */

import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js'
import type { CoreTool, ToolSet } from 'ai'
import { McpClientManager } from './mcp-client-manager.js'

/**
 * Sanitize tool name to be valid for AI SDK
 * - Replace invalid characters with underscores
 * - Ensure it starts with a letter or underscore
 */
export function sanitizeToolName(name: string): string {
  // Replace invalid characters (anything not alphanumeric or underscore) with underscores
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_')

  // Ensure it starts with a letter or underscore
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    sanitized = `tool_${sanitized}`
  }

  return sanitized
}

/**
 * Convert MCP Tool to AI SDK CoreTool format
 */
export function convertMcpToolToAiTool(
  mcpTool: Tool,
  serverName: string,
  manager: McpClientManager
): CoreTool {
  const sanitizedName = sanitizeToolName(`${serverName}_${mcpTool.name}`)

  return {
    description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
    parameters: mcpTool.inputSchema || {
      type: 'object',
      properties: {},
      required: []
    },
    execute: async (args: Record<string, unknown>) => {
      const client = manager.getClient(serverName)
      if (!client) {
        throw new Error(`MCP server ${serverName} not found`)
      }

      try {
        const result: CallToolResult = await client.invokeTool(mcpTool.name, args)

        // Handle different content types
        if (result.content) {
          if (Array.isArray(result.content)) {
            // Multiple content items
            return result.content
              .map((item) => {
                if (item.type === 'text') {
                  return item.text
                } else if (item.type === 'image') {
                  return `[Image: ${item.data}]`
                } else if (item.type === 'resource') {
                  return `[Resource: ${(item as any).resource?.uri}]`
                }
                return JSON.stringify(item)
              })
              .join('\n')
          }
        }

        // Fallback to stringifying the entire result
        return JSON.stringify(result, null, 2)
      } catch (error) {
        console.error(`[MCP Tool] Error executing ${mcpTool.name}:`, error)
        throw error
      }
    }
  }
}

/**
 * Convert all MCP tools from manager to AI SDK ToolSet
 */
export async function getMcpToolsAsToolSet(manager: McpClientManager): Promise<ToolSet> {
  const { tools } = await manager.discoverAll()
  const toolSet: ToolSet = {}

  for (const [serverName, serverTools] of tools.entries()) {
    for (const mcpTool of serverTools) {
      const sanitizedName = sanitizeToolName(`${serverName}_${mcpTool.name}`)
      toolSet[sanitizedName] = convertMcpToolToAiTool(mcpTool, serverName, manager)
    }
  }

  return toolSet
}

/**
 * Create a ToolSet from specific MCP tools
 */
export function createMcpToolSet(
  tools: Array<{ tool: Tool; serverName: string }>,
  manager: McpClientManager
): ToolSet {
  const toolSet: ToolSet = {}

  for (const { tool, serverName } of tools) {
    const sanitizedName = sanitizeToolName(`${serverName}_${tool.name}`)
    toolSet[sanitizedName] = convertMcpToolToAiTool(tool, serverName, manager)
  }

  return toolSet
}

/**
 * Get MCP tool by sanitized name
 */
export function getMcpToolByName(
  sanitizedName: string,
  manager: McpClientManager
): { tool: Tool; serverName: string } | null {
  const clients = manager.getAllClients()

  for (const [serverName, client] of clients.entries()) {
    const tools = client.getTools()
    for (const tool of tools) {
      const expectedSanitizedName = sanitizeToolName(`${serverName}_${tool.name}`)
      if (expectedSanitizedName === sanitizedName) {
        return { tool, serverName }
      }
    }
  }

  return null
}

/**
 * List all available MCP tools with their metadata
 */
export function listMcpTools(
  manager: McpClientManager
): Array<{
  originalName: string
  sanitizedName: string
  serverName: string
  description: string
  inputSchema: any
}> {
  const result: Array<{
    originalName: string
    sanitizedName: string
    serverName: string
    description: string
    inputSchema: any
  }> = []

  const clients = manager.getAllClients()

  for (const [serverName, client] of clients.entries()) {
    const tools = client.getTools()
    for (const tool of tools) {
      result.push({
        originalName: tool.name,
        sanitizedName: sanitizeToolName(`${serverName}_${tool.name}`),
        serverName,
        description: tool.description || '',
        inputSchema: tool.inputSchema
      })
    }
  }

  return result
}

/**
 * Merge MCP tools with existing toolset
 */
export async function mergeMcpTools(
  existingTools: ToolSet,
  manager: McpClientManager,
  options?: {
    prefix?: string
    serverFilter?: string[]
  }
): Promise<ToolSet> {
  const { tools } = await manager.discoverAll()
  const mergedTools: ToolSet = { ...existingTools }

  for (const [serverName, serverTools] of tools.entries()) {
    // Skip if server not in filter
    if (options?.serverFilter && !options.serverFilter.includes(serverName)) {
      continue
    }

    for (const mcpTool of serverTools) {
      const prefix = options?.prefix || ''
      const sanitizedName = sanitizeToolName(`${prefix}${serverName}_${mcpTool.name}`)

      // Don't override existing tools
      if (mergedTools[sanitizedName]) {
        console.warn(`[MCP Tool] Tool ${sanitizedName} already exists, skipping`)
        continue
      }

      mergedTools[sanitizedName] = convertMcpToolToAiTool(mcpTool, serverName, manager)
    }
  }

  return mergedTools
}
