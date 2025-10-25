/**
 * MCP Built-in Tools Manager
 * Manages built-in MCP tools and conversion to AI SDK format
 */

import type {ToolSet} from 'ai'
import {tool as createTool} from 'ai'
import {z} from 'zod'
import type {Tool} from '@modelcontextprotocol/sdk/types.js'
import type {McpPluginConfig} from './types'
import {executeFetchTool, fetchToolDefinition} from './tools/fetch'
import {executeFilesystemTool, filesystemToolDefinition} from './tools/filesystem'
import {executeMemoryTool, memoryToolDefinition} from './tools/memory'
import {executeTimeTool, timeToolDefinition} from './tools/time'
import {
  executeSequentialThinkingTool,
  sequentialThinkingToolDefinition
} from './tools/sequentialthinking'

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

    // Register built-in filesystem tool
    this.registerTool('filesystem', {
      definition: filesystemToolDefinition,
      execute: executeFilesystemTool
    })

    // Register built-in memory tool
    this.registerTool('memory', {
      definition: memoryToolDefinition,
      execute: executeMemoryTool
    })

    // Register built-in time tool
    this.registerTool('time', {
      definition: timeToolDefinition,
      execute: executeTimeTool
    })

    // Register built-in sequential thinking tool
    this.registerTool('sequentialthinking', {
      definition: sequentialThinkingToolDefinition,
      execute: executeSequentialThinkingTool
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
      const aiTool = createTool({
        description: definition.description || '',
        parameters: zodSchema,
        execute: async (args: any) => {
          try {
            return await execute(args, config)
          } catch (error) {
            if (this.config.verbose) {
              console.error(`[MCP] Tool execution failed: ${toolKey}`, error)
            }
            throw error
          }
        }
      })

      // Add inputSchema for prompt-based tool use plugins
      // This is needed by toolUsePlugin to generate system prompts
      ;(aiTool as any).inputSchema = definition.inputSchema

      toolSet[toolKey] = aiTool
    }

    return toolSet
  }

  /**
   * Convert JSON Schema to Zod schema (enhanced version)
   */
  private jsonSchemaToZod(schema: any): z.ZodType<any> {
    if (!schema || typeof schema !== 'object') {
      return z.any()
    }

    const {
      type,
      properties,
      required = [],
      items,
      minimum,
      maximum,
      minItems,
      enum: enumValues,
      additionalProperties
    } = schema

    // Handle object type (or objects without explicit type but with properties)
    if (type === 'object' || (!type && properties)) {
      const shape: Record<string, z.ZodType<any>> = {}

      if (properties && typeof properties === 'object') {
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
      }

      let zodObject = z.object(shape)

      if (additionalProperties !== undefined) {
        if (additionalProperties === true) {
          zodObject = zodObject.catchall(z.any())
        } else if (additionalProperties === false) {
          zodObject = zodObject.catchall(z.never())
        } else {
          zodObject = zodObject.catchall(this.jsonSchemaToZod(additionalProperties))
        }
      }

      return zodObject
    }

    // Handle string type
    if (type === 'string') {
      if (enumValues && Array.isArray(enumValues) && enumValues.length > 0) {
        return z.enum(enumValues as [string, ...string[]])
      }
      return z.string()
    }

    // Handle number type
    if (type === 'number') {
      let zodNumber = z.number()
      if (typeof minimum === 'number') {
        zodNumber = zodNumber.min(minimum)
      }
      if (typeof maximum === 'number') {
        zodNumber = zodNumber.max(maximum)
      }
      return zodNumber
    }

    // Handle integer type
    if (type === 'integer') {
      let zodNumber = z.number().int()
      if (typeof minimum === 'number') {
        zodNumber = zodNumber.min(minimum)
      }
      if (typeof maximum === 'number') {
        zodNumber = zodNumber.max(maximum)
      }
      return zodNumber
    }

    // Handle boolean type
    if (type === 'boolean') {
      return z.boolean()
    }

    // Handle array type
    if (type === 'array') {
      const itemSchema = items ? this.jsonSchemaToZod(items) : z.any()
      let zodArray = z.array(itemSchema)
      if (typeof minItems === 'number') {
        zodArray = zodArray.min(minItems)
      }
      return zodArray
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
