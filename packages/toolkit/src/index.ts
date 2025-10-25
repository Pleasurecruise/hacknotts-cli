/**
 * Toolkit Package - MCP Integration for AI Core
 * Export all MCP-related functionality
 */

// Core MCP Client
export {
  McpClient,
  MCPServerStatus,
  MCPDiscoveryState,
  type MCPServerConfig,
  type DiscoveredMCPPrompt
} from './mcp-client.js'

// MCP Client Manager
export {
  McpClientManager,
  getMcpManager,
  resetMcpManager,
  type MCPStatusChangeListener
} from './mcp-client-manager.js'

// MCP Tool Utilities
export {
  sanitizeToolName,
  convertMcpToolToAiTool,
  getMcpToolsAsToolSet,
  createMcpToolSet,
  getMcpToolByName,
  listMcpTools,
  mergeMcpTools
} from './mcp-tool.js'

// MCP Plugin
export {
  createMcpPlugin,
  createSimpleMcpPlugin,
  disconnectAllMcpServers,
  type McpPluginConfig,
  type McpRequestContext
} from './mcp-plugin.js'

// Built-in tools
export {
  registerReadFileTool,
  type ReadFileToolParams,
  type RegisterReadFileToolOptions
} from './utils/read-file.js'
