import { describe, expect, it } from 'vitest'

import { createMcpManager } from '../manager'

describe('McpManager', () => {
  it('creates fetch tool schema that accepts header records', async () => {
    const manager = await createMcpManager()
    const tools = await manager.getToolSet()

    const fetchTool = tools.fetch
    expect(fetchTool).toBeDefined()

    const input = {
      url: 'https://example.com',
      options: {
        headers: {
          Authorization: 'Bearer token'
        }
      }
    }

    expect(() => fetchTool.parameters.parse(input)).not.toThrow()
  })
})
