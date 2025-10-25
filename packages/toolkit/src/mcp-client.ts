/**
 * MCP Client Implementation
 * Manages connections to MCP servers and handles tool/prompt discovery
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type {
  CallToolResult,
  GetPromptResult,
  ListPromptsResult,
  ListToolsResult,
  Tool
} from '@modelcontextprotocol/sdk/types.js'

/**
 * MCP Server Status Enum
 */
export enum MCPServerStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

/**
 * MCP Discovery State Enum
 */
export enum MCPDiscoveryState {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
  disabled?: boolean
  disabledTools?: string[]
  cwd?: string
}

/**
 * Discovered MCP Prompt
 */
export interface DiscoveredMCPPrompt {
  name: string
  description?: string
  arguments?: Array<{
    name: string
    description?: string
    required?: boolean
  }>
  serverName: string
  invoke: (args?: Record<string, string>) => Promise<GetPromptResult>
}

/**
 * MCP Client Class
 * Manages connection to a single MCP server
 */
export class McpClient {
  private client: Client
  private transport: StdioClientTransport | null = null
  private status: MCPServerStatus = MCPServerStatus.DISCONNECTED
  private discoveryState: MCPDiscoveryState = MCPDiscoveryState.NOT_STARTED
  private tools: Tool[] = []
  private prompts: DiscoveredMCPPrompt[] = []

  constructor(private config: MCPServerConfig) {
    this.client = new Client(
      {
        name: 'mcp-toolkit-client',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          prompts: {}
        }
      }
    )
  }

  /**
   * Connect to MCP server
   */
  async connect(): Promise<void> {
    if (this.status === MCPServerStatus.CONNECTED) {
      console.log(`[MCP] Server ${this.config.name} is already connected`)
      return
    }

    try {
      this.status = MCPServerStatus.CONNECTING
      console.log(`[MCP] Connecting to server: ${this.config.name}`)

      // Create stdio transport
      this.transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args || [],
        env: this.config.env
          ? {
              ...process.env,
              ...this.config.env
            }
          : undefined
      })

      await this.client.connect(this.transport)
      this.status = MCPServerStatus.CONNECTED
      console.log(`[MCP] Successfully connected to server: ${this.config.name}`)
    } catch (error) {
      this.status = MCPServerStatus.ERROR
      console.error(`[MCP] Failed to connect to server ${this.config.name}:`, error)
      throw error
    }
  }

  /**
   * Discover tools and prompts from the server
   */
  async discover(): Promise<{ tools: Tool[]; prompts: DiscoveredMCPPrompt[] }> {
    if (this.status !== MCPServerStatus.CONNECTED) {
      throw new Error(`Server ${this.config.name} is not connected`)
    }

    if (this.discoveryState === MCPDiscoveryState.COMPLETED) {
      return { tools: this.tools, prompts: this.prompts }
    }

    try {
      this.discoveryState = MCPDiscoveryState.IN_PROGRESS
      console.log(`[MCP] Discovering tools and prompts for server: ${this.config.name}`)

      // Discover tools
      const toolsResult: ListToolsResult = await this.client.listTools()
      this.tools = this.filterDisabledTools(toolsResult.tools || [])

      // Discover prompts
      const promptsResult: ListPromptsResult = await this.client.listPrompts()
      this.prompts = (promptsResult.prompts || []).map((prompt) => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments,
        serverName: this.config.name,
        invoke: (args?: Record<string, string>) => this.invokePrompt(prompt.name, args)
      }))

      this.discoveryState = MCPDiscoveryState.COMPLETED
      console.log(
        `[MCP] Discovered ${this.tools.length} tools and ${this.prompts.length} prompts from ${this.config.name}`
      )

      return { tools: this.tools, prompts: this.prompts }
    } catch (error) {
      this.discoveryState = MCPDiscoveryState.NOT_STARTED
      console.error(`[MCP] Failed to discover from server ${this.config.name}:`, error)
      throw error
    }
  }

  /**
   * Filter out disabled tools
   */
  private filterDisabledTools(tools: Tool[]): Tool[] {
    if (!this.config.disabledTools || this.config.disabledTools.length === 0) {
      return tools
    }

    return tools.filter((tool) => !this.config.disabledTools!.includes(tool.name))
  }

  /**
   * Invoke a tool
   */
  async invokeTool(toolName: string, args: Record<string, unknown>): Promise<CallToolResult> {
    if (this.status !== MCPServerStatus.CONNECTED) {
      throw new Error(`Server ${this.config.name} is not connected`)
    }

    try {
      console.log(`[MCP] Invoking tool ${toolName} on server ${this.config.name}`)
      const result = await this.client.callTool({
        name: toolName,
        arguments: args
      })
      return result
    } catch (error) {
      console.error(`[MCP] Failed to invoke tool ${toolName}:`, error)
      throw error
    }
  }

  /**
   * Invoke a prompt
   */
  async invokePrompt(
    promptName: string,
    args?: Record<string, string>
  ): Promise<GetPromptResult> {
    if (this.status !== MCPServerStatus.CONNECTED) {
      throw new Error(`Server ${this.config.name} is not connected`)
    }

    try {
      console.log(`[MCP] Invoking prompt ${promptName} on server ${this.config.name}`)
      const result = await this.client.getPrompt({
        name: promptName,
        arguments: args
      })
      return result
    } catch (error) {
      console.error(`[MCP] Failed to invoke prompt ${promptName}:`, error)
      throw error
    }
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    if (this.status === MCPServerStatus.DISCONNECTED) {
      return
    }

    try {
      console.log(`[MCP] Disconnecting from server: ${this.config.name}`)
      await this.client.close()
      if (this.transport) {
        await this.transport.close()
      }
      this.status = MCPServerStatus.DISCONNECTED
      this.discoveryState = MCPDiscoveryState.NOT_STARTED
      console.log(`[MCP] Disconnected from server: ${this.config.name}`)
    } catch (error) {
      console.error(`[MCP] Error disconnecting from server ${this.config.name}:`, error)
      throw error
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): MCPServerStatus {
    return this.status
  }

  /**
   * Get discovery state
   */
  getDiscoveryState(): MCPDiscoveryState {
    return this.discoveryState
  }

  /**
   * Get discovered tools
   */
  getTools(): Tool[] {
    return this.tools
  }

  /**
   * Get discovered prompts
   */
  getPrompts(): DiscoveredMCPPrompt[] {
    return this.prompts
  }

  /**
   * Get server name
   */
  getServerName(): string {
    return this.config.name
  }
}
