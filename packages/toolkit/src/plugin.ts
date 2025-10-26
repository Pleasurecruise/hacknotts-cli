/**
 * MCP Plugin for aiCore integration
 */

import type { AiPlugin, AiRequestContext } from '@cherrystudio/ai-core'
import type { McpPluginConfig } from './types'
import { createMcpManager, McpManager } from './manager'

/**
 * Create an MCP plugin for aiCore
 * This plugin adds MCP tools to AI requests
 */
export function createMcpPlugin(config: McpPluginConfig = {}): AiPlugin {
  let manager: McpManager | null = null
  let initialized = false

  return {
    name: 'mcp-tools',
    enforce: 'pre',

    // Configure context to add MCP tools
    configureContext: async () => {
      if (!initialized) {
        manager = await createMcpManager({
          verbose: config.verbose,
          toolPrefix: config.toolPrefix,
          autoInitialize: config.autoInitialize
        })
        initialized = true

        if (config.verbose) {
          const tools = manager.getAvailableTools()
          console.log('[MCP Plugin] Available tools:', tools.map((t) => t.name).join(', '))
        }
      }
    },

    // Transform params to add MCP tools
    transformParams: async <T>(params: T, context: AiRequestContext): Promise<T> => {
      if (!manager) {
        return params
      }

      try {
        const mcpTools = await manager.getToolSet()

        // Merge MCP tools with existing tools
        const existingTools = (params as any).tools || {}
        const mergedTools = {
          ...existingTools,
          ...mcpTools
        }

        // Store in context for reference
        context.mcpTools = mcpTools

        return {
          ...params,
          tools: mergedTools
        } as T
      } catch (error) {
        if (config.verbose) {
          console.error('[MCP Plugin] Failed to add tools:', error)
        }
        return params
      }
    },

    // Cleanup on error
    onError: async (error: Error) => {
      if (config.verbose) {
        console.error('[MCP Plugin] Error in request:', error)
      }
    }
  }
}
