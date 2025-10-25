/**
 * MCP Toolkit Types
 * @packageDocumentation
 */

import type { ToolSet } from 'ai'

/**
 * MCP plugin configuration
 */
export interface McpPluginConfig {
  autoInitialize?: boolean
  toolPrefix?: boolean
  verbose?: boolean
}

/**
 * Tool information
 */
export interface McpToolInfo {
  name: string
  description?: string
}
