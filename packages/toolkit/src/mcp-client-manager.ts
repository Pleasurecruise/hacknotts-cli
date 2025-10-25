/**
 * MCP Client Manager
 * Manages multiple MCP server connections and aggregates their tools
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import {
  DiscoveredMCPPrompt,
  MCPServerConfig,
  MCPServerStatus,
  McpClient
} from './mcp-client.js'

/**
 * Status change listener type
 */
export type MCPStatusChangeListener = (serverName: string, status: MCPServerStatus) => void

/**
 * MCP Client Manager
 * Coordinates multiple MCP server connections
 */
export class McpClientManager {
  private clients: Map<string, McpClient> = new Map()
  private statusListeners: Set<MCPStatusChangeListener> = new Set()

  constructor(private configs: MCPServerConfig[] = []) {}

  /**
   * Initialize all configured MCP servers
   */
  async initialize(): Promise<void> {
    const enabledConfigs = this.configs.filter((config) => !config.disabled)

    if (enabledConfigs.length === 0) {
      console.log('[MCP Manager] No MCP servers configured')
      return
    }

    console.log(`[MCP Manager] Initializing ${enabledConfigs.length} MCP server(s)`)

    // Connect to all servers in parallel
    const connectionPromises = enabledConfigs.map(async (config) => {
      try {
        const client = new McpClient(config)
        this.clients.set(config.name, client)
        await client.connect()
        this.notifyStatusChange(config.name, client.getStatus())
      } catch (error) {
        console.error(`[MCP Manager] Failed to initialize server ${config.name}:`, error)
        this.notifyStatusChange(config.name, MCPServerStatus.ERROR)
      }
    })

    await Promise.allSettled(connectionPromises)
    console.log(
      `[MCP Manager] Initialized ${this.getConnectedServers().length}/${enabledConfigs.length} server(s)`
    )
  }

  /**
   * Discover tools and prompts from all connected servers
   */
  async discoverAll(): Promise<{
    tools: Map<string, Tool[]>
    prompts: DiscoveredMCPPrompt[]
  }> {
    const tools = new Map<string, Tool[]>()
    const prompts: DiscoveredMCPPrompt[] = []

    const connectedClients = Array.from(this.clients.values()).filter(
      (client) => client.getStatus() === MCPServerStatus.CONNECTED
    )

    if (connectedClients.length === 0) {
      console.log('[MCP Manager] No connected servers to discover from')
      return { tools, prompts }
    }

    console.log(`[MCP Manager] Discovering from ${connectedClients.length} server(s)`)

    // Discover from all servers in parallel
    const discoveryPromises = connectedClients.map(async (client) => {
      try {
        const result = await client.discover()
        tools.set(client.getServerName(), result.tools)
        prompts.push(...result.prompts)
      } catch (error) {
        console.error(`[MCP Manager] Failed to discover from ${client.getServerName()}:`, error)
      }
    })

    await Promise.allSettled(discoveryPromises)

    const totalTools = Array.from(tools.values()).reduce((sum, t) => sum + t.length, 0)
    console.log(`[MCP Manager] Discovered ${totalTools} tools and ${prompts.length} prompts`)

    return { tools, prompts }
  }

  /**
   * Get a specific MCP client by server name
   */
  getClient(serverName: string): McpClient | undefined {
    return this.clients.get(serverName)
  }

  /**
   * Get all MCP clients
   */
  getAllClients(): Map<string, McpClient> {
    return new Map(this.clients)
  }

  /**
   * Get list of connected server names
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.entries())
      .filter(([_, client]) => client.getStatus() === MCPServerStatus.CONNECTED)
      .map(([name]) => name)
  }

  /**
   * Get server status
   */
  getServerStatus(serverName: string): MCPServerStatus | undefined {
    return this.clients.get(serverName)?.getStatus()
  }

  /**
   * Disconnect all servers
   */
  async disconnectAll(): Promise<void> {
    console.log(`[MCP Manager] Disconnecting ${this.clients.size} server(s)`)

    const disconnectPromises = Array.from(this.clients.values()).map(async (client) => {
      try {
        await client.disconnect()
        this.notifyStatusChange(client.getServerName(), MCPServerStatus.DISCONNECTED)
      } catch (error) {
        console.error(`[MCP Manager] Failed to disconnect ${client.getServerName()}:`, error)
      }
    })

    await Promise.allSettled(disconnectPromises)
    this.clients.clear()
    console.log('[MCP Manager] All servers disconnected')
  }

  /**
   * Disconnect a specific server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName)
    if (!client) {
      console.warn(`[MCP Manager] Server ${serverName} not found`)
      return
    }

    try {
      await client.disconnect()
      this.clients.delete(serverName)
      this.notifyStatusChange(serverName, MCPServerStatus.DISCONNECTED)
      console.log(`[MCP Manager] Disconnected server: ${serverName}`)
    } catch (error) {
      console.error(`[MCP Manager] Failed to disconnect ${serverName}:`, error)
      throw error
    }
  }

  /**
   * Reconnect to a specific server
   */
  async reconnect(serverName: string): Promise<void> {
    const config = this.configs.find((c) => c.name === serverName)
    if (!config) {
      throw new Error(`Configuration for server ${serverName} not found`)
    }

    // Disconnect if already connected
    if (this.clients.has(serverName)) {
      await this.disconnect(serverName)
    }

    // Create new client and connect
    const client = new McpClient(config)
    this.clients.set(serverName, client)

    try {
      await client.connect()
      this.notifyStatusChange(serverName, client.getStatus())
      console.log(`[MCP Manager] Reconnected to server: ${serverName}`)
    } catch (error) {
      this.notifyStatusChange(serverName, MCPServerStatus.ERROR)
      console.error(`[MCP Manager] Failed to reconnect to ${serverName}:`, error)
      throw error
    }
  }

  /**
   * Add a status change listener
   */
  addStatusChangeListener(listener: MCPStatusChangeListener): void {
    this.statusListeners.add(listener)
  }

  /**
   * Remove a status change listener
   */
  removeStatusChangeListener(listener: MCPStatusChangeListener): void {
    this.statusListeners.delete(listener)
  }

  /**
   * Notify all listeners of status change
   */
  private notifyStatusChange(serverName: string, status: MCPServerStatus): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(serverName, status)
      } catch (error) {
        console.error('[MCP Manager] Error in status change listener:', error)
      }
    })
  }

  /**
   * Get statistics about connected servers
   */
  getStats(): {
    total: number
    connected: number
    connecting: number
    disconnected: number
    error: number
  } {
    const stats = {
      total: this.clients.size,
      connected: 0,
      connecting: 0,
      disconnected: 0,
      error: 0
    }

    this.clients.forEach((client) => {
      const status = client.getStatus()
      switch (status) {
        case MCPServerStatus.CONNECTED:
          stats.connected++
          break
        case MCPServerStatus.CONNECTING:
          stats.connecting++
          break
        case MCPServerStatus.DISCONNECTED:
          stats.disconnected++
          break
        case MCPServerStatus.ERROR:
          stats.error++
          break
      }
    })

    return stats
  }
}

/**
 * Global MCP client manager instance
 */
let globalManager: McpClientManager | null = null

/**
 * Get or create the global MCP client manager
 */
export function getMcpManager(configs?: MCPServerConfig[]): McpClientManager {
  if (!globalManager) {
    globalManager = new McpClientManager(configs || [])
  }
  return globalManager
}

/**
 * Reset the global MCP client manager
 */
export async function resetMcpManager(): Promise<void> {
  if (globalManager) {
    await globalManager.disconnectAll()
    globalManager = null
  }
}
