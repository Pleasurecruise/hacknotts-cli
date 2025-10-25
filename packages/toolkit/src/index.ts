/**
 * MCP Utils Toolkit for aiCore plugins system
 * @packageDocumentation
 */

// Core manager
export { McpManager, createMcpManager } from './manager'

// Plugin integration
export { createMcpPlugin } from './plugin'

// Types
export type { McpPluginConfig, McpToolInfo } from './types'

// Built-in tools
export { fetchToolDefinition, executeFetchTool } from './tools/fetch'
export type { FetchToolConfig } from './tools/fetch'
