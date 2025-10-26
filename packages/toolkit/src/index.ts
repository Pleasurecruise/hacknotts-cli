/**
 * MCP Utils Toolkit for aiCore plugins system
 * @packageDocumentation
 */

// Core manager
export { createMcpManager,McpManager } from './manager'

// Plugin integration
export { createMcpPlugin } from './plugin'

// Types
export type { McpPluginConfig, McpToolInfo } from './types'

// Built-in tools
export type { FetchToolConfig } from './tools/fetch'
export { executeFetchTool,fetchToolDefinition } from './tools/fetch'
export type { FilesystemToolConfig } from './tools/filesystem'
export { executeFilesystemTool,filesystemToolDefinition } from './tools/filesystem'
export type { MemoryToolConfig } from './tools/memory'
export { executeMemoryTool,memoryToolDefinition } from './tools/memory'
export type { SequentialThinkingToolConfig } from './tools/sequentialthinking'
export {
  clearAllThinkingSessions,
  clearThinkingSession,
  executeSequentialThinkingTool,
  getThinkingSession,
  sequentialThinkingToolDefinition} from './tools/sequentialthinking'
export type { TimeToolConfig } from './tools/time'
export { executeTimeTool,timeToolDefinition } from './tools/time'
