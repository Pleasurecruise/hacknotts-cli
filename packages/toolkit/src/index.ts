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

export { filesystemToolDefinition, executeFilesystemTool } from './tools/filesystem'
export type { FilesystemToolConfig } from './tools/filesystem'

export { memoryToolDefinition, executeMemoryTool } from './tools/memory'
export type { MemoryToolConfig } from './tools/memory'

export { timeToolDefinition, executeTimeTool } from './tools/time'
export type { TimeToolConfig } from './tools/time'

export {
  sequentialThinkingToolDefinition,
  executeSequentialThinkingTool,
  getThinkingSession,
  clearThinkingSession,
  clearAllThinkingSessions
} from './tools/sequentialthinking'
export type { SequentialThinkingToolConfig } from './tools/sequentialthinking'
