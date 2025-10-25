/**
 * Built-in Memory Tool
 * Knowledge graph management for entities, relations, and observations
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export interface MemoryToolConfig {
  persistPath?: string
}

interface Entity {
  name: string
  entityType: string
  observations: string[]
}

interface Relation {
  from: string
  to: string
  relationType: string
}

interface KnowledgeGraph {
  entities: Map<string, Entity>
  relations: Relation[]
}

// In-memory knowledge graph storage
const knowledgeGraphs = new Map<string, KnowledgeGraph>()

function getGraph(graphId: string = 'default'): KnowledgeGraph {
  if (!knowledgeGraphs.has(graphId)) {
    knowledgeGraphs.set(graphId, {
      entities: new Map(),
      relations: []
    })
  }
  return knowledgeGraphs.get(graphId)!
}

/**
 * Memory tool definition (MCP compatible)
 */
export const memoryToolDefinition: Tool = {
  name: 'memory',
  description:
    'Use this tool to remember information across conversations. Call this to store entities (people, places, concepts), create relationships between them, add observations, or retrieve previously stored information. Use when the user asks you to remember something or recall previous information.',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: [
          'create_entities',
          'create_relations',
          'add_observations',
          'delete_entities',
          'delete_observations',
          'delete_relations',
          'read_graph',
          'search_nodes',
          'open_nodes'
        ],
        description: 'The memory operation to perform'
      },
      entities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            entityType: { type: 'string' },
            observations: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['name', 'entityType', 'observations']
        },
        description: 'Array of entities to create (for create_entities)'
      },
      relations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            relationType: { type: 'string' }
          },
          required: ['from', 'to', 'relationType']
        },
        description: 'Array of relations to create or delete'
      },
      observations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            entityName: { type: 'string' },
            contents: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['entityName', 'contents']
        },
        description: 'Array of observations to add or delete'
      },
      entityNames: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of entity names (for delete_entities, open_nodes)'
      },
      query: {
        type: 'string',
        description: 'Search query (for search_nodes)'
      },
      graphId: {
        type: 'string',
        description: 'Optional graph identifier for multi-graph support',
        default: 'default'
      }
    },
    required: ['operation']
  }
}

/**
 * Memory tool implementation
 */
export async function executeMemoryTool(
  args: {
    operation: string
    entities?: Array<{ name: string; entityType: string; observations: string[] }>
    relations?: Array<{ from: string; to: string; relationType: string }>
    observations?: Array<{ entityName: string; contents: string[] }>
    entityNames?: string[]
    query?: string
    graphId?: string
  },
  config: MemoryToolConfig = {}
): Promise<any> {
  const { operation, graphId = 'default' } = args
  const graph = getGraph(graphId)

  try {
    switch (operation) {
      case 'create_entities': {
        if (!args.entities || args.entities.length === 0) {
          throw new Error('entities array is required for create_entities')
        }

        const created: string[] = []
        for (const entity of args.entities) {
          if (graph.entities.has(entity.name)) {
            throw new Error(`Entity '${entity.name}' already exists`)
          }
          graph.entities.set(entity.name, {
            name: entity.name,
            entityType: entity.entityType,
            observations: [...entity.observations]
          })
          created.push(entity.name)
        }

        return {
          success: true,
          operation: 'create_entities',
          created,
          count: created.length
        }
      }

      case 'create_relations': {
        if (!args.relations || args.relations.length === 0) {
          throw new Error('relations array is required for create_relations')
        }

        const created: Relation[] = []
        for (const relation of args.relations) {
          // Check if entities exist
          if (!graph.entities.has(relation.from)) {
            throw new Error(`Entity '${relation.from}' does not exist`)
          }
          if (!graph.entities.has(relation.to)) {
            throw new Error(`Entity '${relation.to}' does not exist`)
          }

          // Check for duplicate relation
          const exists = graph.relations.some(
            (r) =>
              r.from === relation.from &&
              r.to === relation.to &&
              r.relationType === relation.relationType
          )

          if (!exists) {
            graph.relations.push({ ...relation })
            created.push(relation)
          }
        }

        return {
          success: true,
          operation: 'create_relations',
          created,
          count: created.length
        }
      }

      case 'add_observations': {
        if (!args.observations || args.observations.length === 0) {
          throw new Error('observations array is required for add_observations')
        }

        const updated: string[] = []
        for (const obs of args.observations) {
          const entity = graph.entities.get(obs.entityName)
          if (!entity) {
            throw new Error(`Entity '${obs.entityName}' does not exist`)
          }

          entity.observations.push(...obs.contents)
          updated.push(obs.entityName)
        }

        return {
          success: true,
          operation: 'add_observations',
          updated,
          count: updated.length
        }
      }

      case 'delete_entities': {
        if (!args.entityNames || args.entityNames.length === 0) {
          throw new Error('entityNames array is required for delete_entities')
        }

        const deleted: string[] = []
        for (const name of args.entityNames) {
          if (graph.entities.delete(name)) {
            // Delete associated relations
            graph.relations = graph.relations.filter(
              (r) => r.from !== name && r.to !== name
            )
            deleted.push(name)
          }
        }

        return {
          success: true,
          operation: 'delete_entities',
          deleted,
          count: deleted.length
        }
      }

      case 'delete_observations': {
        if (!args.observations || args.observations.length === 0) {
          throw new Error('observations array is required for delete_observations')
        }

        const updated: string[] = []
        for (const obs of args.observations) {
          const entity = graph.entities.get(obs.entityName)
          if (entity) {
            entity.observations = entity.observations.filter(
              (o) => !obs.contents.includes(o)
            )
            updated.push(obs.entityName)
          }
        }

        return {
          success: true,
          operation: 'delete_observations',
          updated,
          count: updated.length
        }
      }

      case 'delete_relations': {
        if (!args.relations || args.relations.length === 0) {
          throw new Error('relations array is required for delete_relations')
        }

        let deleted = 0
        for (const relation of args.relations) {
          const initialLength = graph.relations.length
          graph.relations = graph.relations.filter(
            (r) =>
              !(
                r.from === relation.from &&
                r.to === relation.to &&
                r.relationType === relation.relationType
              )
          )
          deleted += initialLength - graph.relations.length
        }

        return {
          success: true,
          operation: 'delete_relations',
          count: deleted
        }
      }

      case 'read_graph': {
        const entities = Array.from(graph.entities.values())
        return {
          success: true,
          operation: 'read_graph',
          graph: {
            entities,
            relations: graph.relations,
            entityCount: entities.length,
            relationCount: graph.relations.length
          }
        }
      }

      case 'search_nodes': {
        if (!args.query) {
          throw new Error('query is required for search_nodes')
        }

        const query = args.query.toLowerCase()
        const results = Array.from(graph.entities.values()).filter((entity) => {
          // Search in name, type, and observations
          return (
            entity.name.toLowerCase().includes(query) ||
            entity.entityType.toLowerCase().includes(query) ||
            entity.observations.some((obs) => obs.toLowerCase().includes(query))
          )
        })

        return {
          success: true,
          operation: 'search_nodes',
          query: args.query,
          results,
          count: results.length
        }
      }

      case 'open_nodes': {
        if (!args.entityNames || args.entityNames.length === 0) {
          throw new Error('entityNames array is required for open_nodes')
        }

        const results: Entity[] = []
        const notFound: string[] = []

        for (const name of args.entityNames) {
          const entity = graph.entities.get(name)
          if (entity) {
            results.push(entity)
          } else {
            notFound.push(name)
          }
        }

        return {
          success: true,
          operation: 'open_nodes',
          results,
          notFound,
          count: results.length
        }
      }

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      operation,
      error: errorMessage
    }
  }
}
