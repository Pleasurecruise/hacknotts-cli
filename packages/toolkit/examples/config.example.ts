/**
 * Example MCP Server Configurations
 * Copy and modify these configurations for your use case
 */

import type { MCPServerConfig } from '../src/mcp-client.js'

/**
 * Filesystem Server - Access local files
 */
export const filesystemConfig: MCPServerConfig = {
  name: 'filesystem',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/directory'],
  // Disable dangerous operations
  disabledTools: ['rm', 'rmdir', 'write_file']
}

/**
 * Git Server - Git operations
 */
export const gitConfig: MCPServerConfig = {
  name: 'git',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-git'],
  env: {
    GIT_DIR: '/path/to/repo/.git'
  }
}

/**
 * GitHub Server - GitHub API operations
 */
export const githubConfig: MCPServerConfig = {
  name: 'github',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  env: {
    GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || ''
  },
  // Disable if no token is available
  disabled: !process.env.GITHUB_TOKEN
}

/**
 * Brave Search Server - Web search capabilities
 */
export const braveSearchConfig: MCPServerConfig = {
  name: 'brave-search',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-brave-search'],
  env: {
    BRAVE_API_KEY: process.env.BRAVE_API_KEY || ''
  },
  disabled: !process.env.BRAVE_API_KEY
}

/**
 * Google Maps Server - Location and mapping
 */
export const googleMapsConfig: MCPServerConfig = {
  name: 'google-maps',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-google-maps'],
  env: {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || ''
  },
  disabled: !process.env.GOOGLE_MAPS_API_KEY
}

/**
 * Postgres Server - Database operations
 */
export const postgresConfig: MCPServerConfig = {
  name: 'postgres',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-postgres'],
  env: {
    POSTGRES_CONNECTION_STRING: process.env.DATABASE_URL || ''
  },
  disabled: !process.env.DATABASE_URL
}

/**
 * Puppeteer Server - Browser automation
 */
export const puppeteerConfig: MCPServerConfig = {
  name: 'puppeteer',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-puppeteer']
}

/**
 * Memory Server - Persistent key-value storage
 */
export const memoryConfig: MCPServerConfig = {
  name: 'memory',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-memory']
}

/**
 * Custom Local Server
 */
export const customServerConfig: MCPServerConfig = {
  name: 'my-custom-server',
  command: 'node',
  args: ['./path/to/my-server.js'],
  env: {
    CUSTOM_ENV_VAR: 'value'
  },
  cwd: '/path/to/server/directory'
}

/**
 * All Servers Configuration
 * Use this to enable multiple servers at once
 */
export const allServersConfig: MCPServerConfig[] = [
  filesystemConfig,
  gitConfig,
  githubConfig,
  braveSearchConfig,
  googleMapsConfig,
  postgresConfig,
  puppeteerConfig,
  memoryConfig
]

/**
 * Safe Development Configuration
 * Only include safe, non-destructive servers for development
 */
export const devConfig: MCPServerConfig[] = [
  {
    ...filesystemConfig,
    disabledTools: ['rm', 'rmdir', 'write_file', 'move_file']
  },
  {
    ...gitConfig,
    disabledTools: ['push', 'force_push', 'reset_hard']
  },
  memoryConfig
]

/**
 * Production Configuration
 * Include only essential servers with strict permissions
 */
export const prodConfig: MCPServerConfig[] = [
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/safe/data/directory'],
    disabledTools: ['rm', 'rmdir', 'write_file', 'move_file', 'create_directory']
  },
  {
    ...memoryConfig
  }
]
