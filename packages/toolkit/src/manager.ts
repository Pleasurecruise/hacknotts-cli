/**
 * MCP Built-in Tools Manager
 * Manages built-in MCP tools and conversion to AI SDK format
 */

import type { ToolSet } from 'ai'
import { tool as createTool } from 'ai'
import { z } from 'zod'
import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { McpPluginConfig } from './types'
import { fetchToolDefinition, executeFetchTool } from './tools/fetch'

/**
 * Built-in tool definition with executor
 */
interface BuiltInTool {
  definition: Tool
  execute: (args: any, config?: any) => Promise<any>
  config?: any
}

/**
 * MCP Built-in Tools Manager
 * Handles registration and conversion of built-in MCP tools
 */
export class McpManager {
  private tools: Map<string, BuiltInTool> = new Map()
  private config: McpPluginConfig

  constructor(config: McpPluginConfig = {}) {
    this.config = {
      autoInitialize: true,
      toolPrefix: false,
      verbose: false,
      ...config
    }
  }

  /**
   * Initialize built-in tools
   */
  async initialize() {
    // Register built-in fetch tool
    this.registerTool('fetch', {
      definition: fetchToolDefinition,
      execute: executeFetchTool
    })

    if (this.config.verbose) {
      console.log(`[MCP] Initialized ${this.tools.size} built-in tools`)
    }
  }

  /**
   * Register a built-in tool
   */
  registerTool(name: string, tool: BuiltInTool) {
    const toolKey = this.config.toolPrefix ? `mcp_${name}` : name
    this.tools.set(toolKey, tool)

    if (this.config.verbose) {
      console.log(`[MCP] Registered tool: ${toolKey}`)
    }
  }

  /**
   * Convert MCP tools to AI SDK ToolSet format
   */
  async getToolSet(): Promise<ToolSet> {
    const toolSet: ToolSet = {}

    for (const [toolKey, builtInTool] of this.tools.entries()) {
      const { definition, execute, config } = builtInTool

      // Convert JSON Schema to Zod schema
      const zodSchema = this.jsonSchemaToZod(definition.inputSchema)

      // Create AI SDK tool
      toolSet[toolKey] = createTool({
        description: definition.description || '',
        parameters: zodSchema,
        execute: async (args: any) => {
          try {
            const result = await execute(args, config)
            return result
          } catch (error) {
            if (this.config.verbose) {
              console.error(`[MCP] Tool execution failed: ${toolKey}`, error)
            }
            throw error
          }
        }
      })
    }

    return toolSet
  }

  /**
   * Convert JSON Schema to Zod schema (simplified version)
   */
  private jsonSchemaToZod(schema: any): z.ZodType<any> {
    if (!schema || typeof schema !== 'object') {
      return z.any()
    }

    const { type, properties, required = [] } = schema

    if (type === 'object' && properties) {
      const shape: Record<string, z.ZodType<any>> = {}

      for (const [key, propSchema] of Object.entries(properties as Record<string, any>)) {
        let zodType = this.jsonSchemaToZod(propSchema)

        // Make optional if not in required array
        if (!required.includes(key)) {
          zodType = zodType.optional()
        }

        if (propSchema.description) {
          zodType = zodType.describe(propSchema.description)
        }

        shape[key] = zodType
      }

      return z.object(shape)
    }

    if (type === 'string') {
      if (schema.enum) {
        return z.enum(schema.enum)
      }
      return z.string()
    }

    if (type === 'number' || type === 'integer') {
      return z.number()
    }

    if (type === 'boolean') {
      return z.boolean()
    }

    if (type === 'array') {
      const itemSchema = schema.items ? this.jsonSchemaToZod(schema.items) : z.any()
      return z.array(itemSchema)
    }

    return z.any()
  }

  /**
   * Get list of available tools
   */
  getAvailableTools(): Array<{ name: string; description: string }> {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.definition.description || ''
    }))
  }

  /**
   * Cleanup
   */
  async shutdown() {
    this.tools.clear()
  }
}

/**
 * Create and initialize an MCP manager
 */
export async function createMcpManager(config?: McpPluginConfig): Promise<McpManager> {
  const manager = new McpManager(config)
  if (config?.autoInitialize !== false) {
    await manager.initialize()
  }
  return manager
}
