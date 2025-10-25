# Toolkit - MCP Integration for AI Core

This package provides Model Context Protocol (MCP) integration for the AI Core plugin system, enabling seamless connection to MCP servers and usage of their tools.

## Features

- 🔌 **Easy MCP Server Connection** - Connect to multiple MCP servers with simple configuration
- 🛠️ **Automatic Tool Discovery** - Automatically discover and convert MCP tools to AI SDK format
- 🔄 **Plugin System Integration** - Seamlessly integrate with AI Core's plugin system
- 📦 **Tool Management** - Merge, filter, and prefix MCP tools
- 🎯 **Type-Safe** - Full TypeScript support with type definitions
- 🔍 **Status Monitoring** - Track connection status and statistics

## Installation

```bash
npm install toolkit
```

## Quick Start

### 1. Basic Usage with Plugin System

```typescript
import { createAI } from '@cherrystudio/ai-core'
import { createMcpPlugin } from 'toolkit'

// Define your MCP servers
const mcpServers = [
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
  },
  {
    name: 'git',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
    env: {
      GIT_DIR: '/path/to/repo/.git'
    }
  }
]

// Create the AI instance with MCP plugin
const ai = createAI({
  plugins: [
    createMcpPlugin({
      servers: mcpServers,
      autoInitialize: true,
      autoDiscover: true,
      toolMergeStrategy: 'merge'
    })
  ]
})

// Use the AI with MCP tools automatically available
const result = await ai.streamText({
  model: 'openai:gpt-4',
  prompt: 'List files in the current directory'
})
```

### 2. Manual MCP Manager Usage

```typescript
import { McpClientManager, getMcpToolsAsToolSet } from 'toolkit'

// Create and initialize manager
const manager = new McpClientManager([
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp']
  }
])

await manager.initialize()

// Discover and use tools
const tools = await getMcpToolsAsToolSet(manager)

// Use with AI SDK directly
import { streamText } from 'ai'

const result = await streamText({
  model: yourModel,
  prompt: 'What files are available?',
  tools
})

// Cleanup when done
await manager.disconnectAll()
```

### 3. Advanced Plugin Configuration

```typescript
import { createMcpPlugin } from 'toolkit'

const mcpPlugin = createMcpPlugin({
  servers: [
    {
      name: 'server1',
      command: 'mcp-server',
      args: ['--config', 'config.json'],
      disabled: false,
      disabledTools: ['dangerous_tool'] // Disable specific tools
    }
  ],

  // Auto-initialize on first request
  autoInitialize: true,

  // Auto-discover tools for each request
  autoDiscover: true,

  // Merge with existing tools or replace them
  toolMergeStrategy: 'merge',

  // Add prefix to all MCP tool names
  toolPrefix: 'mcp_',

  // Only use specific servers
  serverFilter: ['server1'],

  // Enable verbose logging
  verbose: true
})
```

## API Reference

### MCP Plugin

#### `createMcpPlugin(config: McpPluginConfig): AiPlugin`

Creates an MCP plugin for the AI Core plugin system.

**Configuration Options:**

- `servers: MCPServerConfig[]` - Array of MCP server configurations (required)
- `autoInitialize?: boolean` - Auto-initialize servers (default: `true`)
- `autoDiscover?: boolean` - Auto-discover tools (default: `true`)
- `toolMergeStrategy?: 'merge' | 'replace'` - How to handle existing tools (default: `'merge'`)
- `toolPrefix?: string` - Prefix for tool names (default: `''`)
- `serverFilter?: string[]` - Filter servers by name
- `customManager?: McpClientManager` - Use custom manager instance
- `verbose?: boolean` - Enable verbose logging (default: `false`)

#### `createSimpleMcpPlugin(servers: MCPServerConfig[]): AiPlugin`

Creates an MCP plugin with default settings.

### MCP Client Manager

#### `class McpClientManager`

Manages multiple MCP server connections.

**Methods:**

- `async initialize()` - Initialize all configured servers
- `async discoverAll()` - Discover tools and prompts from all servers
- `getClient(serverName: string)` - Get specific client by name
- `getAllClients()` - Get all clients
- `getConnectedServers()` - Get list of connected server names
- `async disconnect(serverName: string)` - Disconnect specific server
- `async disconnectAll()` - Disconnect all servers
- `async reconnect(serverName: string)` - Reconnect to server
- `getStats()` - Get connection statistics

### MCP Client

#### `class McpClient`

Manages connection to a single MCP server.

**Methods:**

- `async connect()` - Connect to server
- `async discover()` - Discover tools and prompts
- `async invokeTool(name, args)` - Invoke a tool
- `async invokePrompt(name, args)` - Invoke a prompt
- `async disconnect()` - Disconnect from server
- `getStatus()` - Get connection status
- `getTools()` - Get discovered tools
- `getPrompts()` - Get discovered prompts

### Tool Utilities

#### `getMcpToolsAsToolSet(manager: McpClientManager): Promise<ToolSet>`

Convert all MCP tools to AI SDK ToolSet format.

#### `mergeMcpTools(existingTools: ToolSet, manager: McpClientManager, options?): Promise<ToolSet>`

Merge MCP tools with existing tools.

**Options:**
- `prefix?: string` - Add prefix to tool names
- `serverFilter?: string[]` - Only include specific servers

#### `listMcpTools(manager: McpClientManager): Array<ToolInfo>`

List all available MCP tools with metadata.

## Server Configuration

### MCPServerConfig

```typescript
interface MCPServerConfig {
  name: string              // Unique server name
  command: string           // Command to start server
  args?: string[]          // Command arguments
  env?: Record<string, string>  // Environment variables
  disabled?: boolean       // Disable this server
  disabledTools?: string[] // Disable specific tools
  cwd?: string            // Working directory
}
```

## Examples

### Example 1: Filesystem Server

```typescript
const filesystemServer = {
  name: 'filesystem',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/user/documents']
}
```

### Example 2: Git Server

```typescript
const gitServer = {
  name: 'git',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-git'],
  env: {
    GIT_DIR: '/path/to/repo/.git'
  }
}
```

### Example 3: Custom Server with Disabled Tools

```typescript
const customServer = {
  name: 'custom',
  command: './my-mcp-server',
  args: ['--port', '3000'],
  disabledTools: ['dangerous_tool', 'admin_tool']
}
```

## Status Monitoring

```typescript
import { getMcpManager } from 'toolkit'

const manager = getMcpManager(servers)

// Add status change listener
manager.addStatusChangeListener((serverName, status) => {
  console.log(`Server ${serverName} status changed to ${status}`)
})

// Get statistics
const stats = manager.getStats()
console.log(`Connected: ${stats.connected}/${stats.total}`)
```

## Error Handling

```typescript
import { McpClientManager, MCPServerStatus } from 'toolkit'

const manager = new McpClientManager(servers)

try {
  await manager.initialize()
} catch (error) {
  console.error('Failed to initialize MCP servers:', error)
}

// Check individual server status
const status = manager.getServerStatus('filesystem')
if (status === MCPServerStatus.ERROR) {
  console.log('Filesystem server failed to connect')
  // Try to reconnect
  await manager.reconnect('filesystem')
}
```

## Best Practices

1. **Reuse Connections** - Keep the manager instance alive to reuse connections across requests
2. **Handle Errors** - Always handle connection errors gracefully
3. **Monitor Status** - Use status listeners to track connection health
4. **Clean Shutdown** - Call `disconnectAll()` when shutting down your application
5. **Tool Filtering** - Use `disabledTools` to disable risky tools
6. **Server Filtering** - Use `serverFilter` to limit which servers are used per request

## Troubleshooting

### Servers Not Connecting

Check that:
- The MCP server command is correct and accessible
- Required npm packages are installed
- Environment variables are properly set
- The server supports the stdio transport

### Tools Not Appearing

Check that:
- Servers are connected (`getStats()`)
- Discovery has completed (`discoverAll()`)
- Tools are not in the `disabledTools` list
- Tool names are not conflicting

### Performance Issues

Consider:
- Caching tool discovery results
- Using `serverFilter` to limit active servers
- Disabling `autoDiscover` and managing discovery manually

## License

MIT