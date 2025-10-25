/**
 * MCP Plugin for AI Core
 * Integrates MCP tools into the AI Core plugin system
 */

import type { AiPlugin, AiRequestContext } from '@cherrystudio/ai-core'
import type { ToolSet } from 'ai'
import { MCPServerConfig } from './mcp-client.js'
import { getMcpManager, McpClientManager } from './mcp-client-manager.js'
import { getMcpToolsAsToolSet, mergeMcpTools } from './mcp-tool.js'

/**
 * MCP Plugin Configuration
 */
export interface McpPluginConfig {
  /**
   * MCP server configurations
   */
  servers: MCPServerConfig[]

  /**
   * Whether to automatically initialize MCP servers
   * @default true
   */
  autoInitialize?: boolean

  /**
   * Whether to automatically discover tools
   * @default true
   */
  autoDiscover?: boolean

  /**
   * Whether to merge MCP tools with existing tools or replace them
   * @default 'merge'
   */
  toolMergeStrategy?: 'merge' | 'replace'

  /**
   * Prefix for MCP tool names
   * @default ''
   */
  toolPrefix?: string

  /**
   * Filter which servers to use (by server name)
   * If not provided, all servers will be used
   */
  serverFilter?: string[]

  /**
   * Custom manager instance (for advanced use cases)
   */
  customManager?: McpClientManager

  /**
   * Whether to enable verbose logging
   * @default false
   */
  verbose?: boolean
}

/**
 * Extended context with MCP manager
 */
export interface McpRequestContext extends AiRequestContext {
  mcpManager?: McpClientManager
  mcpToolsDiscovered?: boolean
}

/**
 * Create MCP plugin for AI Core
 */
export function createMcpPlugin(config: McpPluginConfig): AiPlugin {
  const {
    servers,
    autoInitialize = true,
    autoDiscover = true,
    toolMergeStrategy = 'merge',
    toolPrefix = '',
    serverFilter,
    customManager,
    verbose = false
  } = config

  let manager: McpClientManager | null = customManager || null
  let initialized = false
  let toolsCache: ToolSet | null = null

  const log = (message: string, ...args: any[]) => {
    if (verbose) {
      console.log(`[MCP Plugin] ${message}`, ...args)
    }
  }

  return {
    name: 'mcp-tools-plugin',
    enforce: 'pre', // Run early to add tools before other plugins

    /**
     * Configure context - Initialize MCP manager
     */
    async configureContext(context: McpRequestContext): Promise<void> {
      // Get or create manager
      if (!manager) {
        manager = customManager || getMcpManager(servers)
      }

      // Store manager in context for other plugins to use
      context.mcpManager = manager

      // Auto-initialize if enabled and not already initialized
      if (autoInitialize && !initialized) {
        log('Auto-initializing MCP servers...')
        try {
          await manager.initialize()
          initialized = true

          const stats = manager.getStats()
          log(
            `MCP servers initialized: ${stats.connected}/${stats.total} connected`
          )
        } catch (error) {
          console.error('[MCP Plugin] Failed to initialize MCP servers:', error)
        }
      }
    },

    /**
     * Transform params - Add MCP tools to the request
     */
    async transformParams<T>(params: T, context: McpRequestContext): Promise<T> {
      if (!manager) {
        log('Manager not available, skipping tool discovery')
        return params
      }

      // Check if this request already has tools
      const hasTools = params && typeof params === 'object' && 'tools' in params

      // Skip if not auto-discovering
      if (!autoDiscover) {
        log('Auto-discover disabled, skipping')
        return params
      }

      try {
        // Get MCP tools
        let mcpTools: ToolSet

        if (toolsCache && context.mcpToolsDiscovered) {
          // Use cached tools if already discovered
          mcpTools = toolsCache
          log('Using cached MCP tools')
        } else {
          // Discover tools
          log('Discovering MCP tools...')
          mcpTools = await getMcpToolsAsToolSet(manager)
          toolsCache = mcpTools
          context.mcpToolsDiscovered = true

          const toolCount = Object.keys(mcpTools).length
          log(`Discovered ${toolCount} MCP tools`)
        }

        // No MCP tools available
        if (Object.keys(mcpTools).length === 0) {
          log('No MCP tools discovered')
          return params
        }

        // Apply server filter if specified
        if (serverFilter && serverFilter.length > 0) {
          const filteredTools: ToolSet = {}
          for (const [toolName, tool] of Object.entries(mcpTools)) {
            const serverName = toolName.split('_')[0]
            if (serverFilter.includes(serverName)) {
              filteredTools[toolName] = tool
            }
          }
          mcpTools = filteredTools
          log(`Filtered to ${Object.keys(mcpTools).length} tools from selected servers`)
        }

        // Apply prefix if specified
        if (toolPrefix) {
          const prefixedTools: ToolSet = {}
          for (const [toolName, tool] of Object.entries(mcpTools)) {
            prefixedTools[`${toolPrefix}${toolName}`] = tool
          }
          mcpTools = prefixedTools
          log(`Applied prefix "${toolPrefix}" to tool names`)
        }

        // Merge or replace tools based on strategy
        if (hasTools) {
          const existingTools = (params as any).tools as ToolSet

          if (toolMergeStrategy === 'merge') {
            // Merge with existing tools
            const mergedTools = { ...existingTools, ...mcpTools }
            log(`Merged ${Object.keys(mcpTools).length} MCP tools with ${Object.keys(existingTools).length} existing tools`)
            return { ...params, tools: mergedTools } as T
          } else {
            // Replace existing tools
            log(`Replaced existing tools with ${Object.keys(mcpTools).length} MCP tools`)
            return { ...params, tools: mcpTools } as T
          }
        } else {
          // No existing tools, just add MCP tools
          log(`Added ${Object.keys(mcpTools).length} MCP tools to request`)
          return { ...params, tools: mcpTools } as T
        }
      } catch (error) {
        console.error('[MCP Plugin] Error during tool discovery:', error)
        // Return original params on error
        return params
      }
    },

    /**
     * Cleanup on error
     */
    async onError(error: Error, context: McpRequestContext): Promise<void> {
      log('Error occurred:', error.message)
      // Could implement retry logic or cleanup here
    },

    /**
     * Cleanup on request end
     */
    async onRequestEnd(context: McpRequestContext): Promise<void> {
      // Optional: Could implement cleanup logic here
      // For now, we keep connections alive for reuse
    }
  }
}

/**
 * Helper function to create a simple MCP plugin with default settings
 */
export function createSimpleMcpPlugin(servers: MCPServerConfig[]): AiPlugin {
  return createMcpPlugin({
    servers,
    autoInitialize: true,
    autoDiscover: true,
    toolMergeStrategy: 'merge',
    verbose: false
  })
}

/**
 * Export utility to manually control MCP manager
 */
export async function disconnectAllMcpServers(): Promise<void> {
  const manager = getMcpManager()
  await manager.disconnectAll()
}
