/**
 * Basic MCP Plugin Usage Example
 * This example demonstrates how to use the MCP plugin with AI Core
 */

import { createMcpPlugin } from '../src/mcp-plugin.js'

// Example 1: Simple filesystem server setup
const filesystemPlugin = createMcpPlugin({
  servers: [
    {
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()]
    }
  ],
  autoInitialize: true,
  autoDiscover: true,
  verbose: true
})

// Example 2: Multiple servers with advanced configuration
const advancedPlugin = createMcpPlugin({
  servers: [
    {
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      disabledTools: ['rm', 'rmdir'] // Disable dangerous operations
    },
    {
      name: 'git',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-git'],
      env: {
        GIT_DIR: '.git'
      }
    },
    {
      name: 'github',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || ''
      },
      disabled: !process.env.GITHUB_TOKEN // Only enable if token is available
    }
  ],
  autoInitialize: true,
  autoDiscover: true,
  toolMergeStrategy: 'merge',
  toolPrefix: 'mcp_',
  verbose: true
})

// Example 3: Using with AI Core
async function exampleUsage() {
  // Note: This is pseudo-code, adjust based on your actual AI Core setup
  /*
  const ai = createAI({
    plugins: [advancedPlugin]
  })

  const result = await ai.streamText({
    model: 'openai:gpt-4',
    prompt: 'What files are in the current directory? Can you read one of them?',
    // MCP tools will be automatically added
  })

  for await (const chunk of result) {
    console.log(chunk)
  }
  */
}

// Example 4: Manual manager usage
async function manualManagerExample() {
  const { McpClientManager, getMcpToolsAsToolSet } = await import('../src/index.js')

  const manager = new McpClientManager([
    {
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp']
    }
  ])

  try {
    // Initialize connection
    await manager.initialize()
    console.log('Connected servers:', manager.getConnectedServers())

    // Get tools
    const tools = await getMcpToolsAsToolSet(manager)
    console.log('Available tools:', Object.keys(tools))

    // Get statistics
    const stats = manager.getStats()
    console.log('Stats:', stats)

    // Cleanup
    await manager.disconnectAll()
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run examples (commented out - uncomment to test)
// manualManagerExample().catch(console.error)

export { filesystemPlugin, advancedPlugin }
