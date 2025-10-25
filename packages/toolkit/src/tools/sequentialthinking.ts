/**
 * Built-in Sequential Thinking Tool
 * Enables structured, step-by-step problem-solving with revision capabilities
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'

export interface SequentialThinkingToolConfig {
  maxThoughts?: number
  trackHistory?: boolean
}

interface ThinkingStep {
  thought: string
  thoughtNumber: number
  totalThoughts: number
  nextThoughtNeeded: boolean
  timestamp: number
  isRevision?: boolean
  revisesThought?: number
  branchFromThought?: number
  branchId?: string
}

// Store thinking history per session
const thinkingSessions = new Map<string, ThinkingStep[]>()

/**
 * Sequential thinking tool definition (MCP compatible)
 */
export const sequentialThinkingToolDefinition: Tool = {
  name: 'sequentialthinking',
  description:
    'Use this tool for complex problem-solving that requires step-by-step analysis. Call this when facing difficult questions, multi-step reasoning, or when you need to think through a problem systematically. Supports revisions and branching for exploring alternative approaches.',
  inputSchema: {
    type: 'object',
    properties: {
      thought: {
        type: 'string',
        description:
          'The current analytical step or thought. Can include analysis, hypothesis, or revision of previous thinking.'
      },
      nextThoughtNeeded: {
        type: 'boolean',
        description: 'Whether additional thinking steps are required to complete the analysis'
      },
      thoughtNumber: {
        type: 'integer',
        minimum: 1,
        description: 'The sequential position of this thought (starting from 1)'
      },
      totalThoughts: {
        type: 'integer',
        minimum: 1,
        description:
          'Estimated total number of thoughts needed (can be adjusted as thinking progresses)'
      },
      isRevision: {
        type: 'boolean',
        description: 'Indicates if this thought is reconsidering or revising previous analysis'
      },
      revisesThought: {
        type: 'integer',
        minimum: 1,
        description: 'Which thought number is being reconsidered (if isRevision is true)'
      },
      branchFromThought: {
        type: 'integer',
        minimum: 1,
        description: 'Thought number where an alternative approach branches from'
      },
      branchId: {
        type: 'string',
        description: 'Identifier for alternative thinking paths (e.g., "approach-a", "hypothesis-2")'
      },
      needsMoreThoughts: {
        type: 'boolean',
        description: 'Signal that the final analysis requires expansion beyond initial estimate'
      },
      sessionId: {
        type: 'string',
        description: 'Optional session identifier for tracking multiple thinking sessions',
        default: 'default'
      }
    },
    required: ['thought', 'nextThoughtNeeded', 'thoughtNumber', 'totalThoughts']
  }
}

/**
 * Sequential thinking tool implementation
 */
export async function executeSequentialThinkingTool(
  args: {
    thought: string
    nextThoughtNeeded: boolean
    thoughtNumber: number
    totalThoughts: number
    isRevision?: boolean
    revisesThought?: number
    branchFromThought?: number
    branchId?: string
    needsMoreThoughts?: boolean
    sessionId?: string
  },
  config: SequentialThinkingToolConfig = {}
): Promise<any> {
  const {
    thought,
    nextThoughtNeeded,
    thoughtNumber,
    totalThoughts,
    isRevision,
    revisesThought,
    branchFromThought,
    branchId,
    needsMoreThoughts,
    sessionId = 'default'
  } = args

  const { maxThoughts = 100, trackHistory = true } = config

  try {
    // Validate inputs
    if (!thought || thought.trim().length === 0) {
      throw new Error('thought cannot be empty')
    }

    if (thoughtNumber < 1) {
      throw new Error('thoughtNumber must be at least 1')
    }

    if (totalThoughts < 1) {
      throw new Error('totalThoughts must be at least 1')
    }

    if (thoughtNumber > maxThoughts) {
      throw new Error(`thoughtNumber exceeds maximum allowed thoughts (${maxThoughts})`)
    }

    if (isRevision && !revisesThought) {
      throw new Error('revisesThought must be provided when isRevision is true')
    }

    if (branchId && !branchFromThought) {
      throw new Error('branchFromThought must be provided when branchId is specified')
    }

    // Create thinking step
    const step: ThinkingStep = {
      thought,
      thoughtNumber,
      totalThoughts,
      nextThoughtNeeded,
      timestamp: Date.now(),
      isRevision,
      revisesThought,
      branchFromThought,
      branchId
    }

    // Store in history if tracking is enabled
    if (trackHistory) {
      if (!thinkingSessions.has(sessionId)) {
        thinkingSessions.set(sessionId, [])
      }
      thinkingSessions.get(sessionId)!.push(step)
    }

    // Calculate progress
    const progress = {
      current: thoughtNumber,
      total: totalThoughts,
      percentage: Math.round((thoughtNumber / totalThoughts) * 100),
      remaining: Math.max(0, totalThoughts - thoughtNumber)
    }

    // Analyze thought structure
    const analysis = {
      isInitial: thoughtNumber === 1,
      isFinal: !nextThoughtNeeded && thoughtNumber >= totalThoughts,
      isIntermediate: thoughtNumber > 1 && nextThoughtNeeded,
      needsExpansion: needsMoreThoughts || false,
      isRevising: isRevision || false,
      isBranching: !!branchId,
      wordCount: thought.split(/\s+/).length
    }

    // Get session context if available
    const sessionHistory = trackHistory ? thinkingSessions.get(sessionId) : undefined
    const context = sessionHistory
      ? {
          totalSteps: sessionHistory.length,
          revisionCount: sessionHistory.filter((s) => s.isRevision).length,
          branchCount: new Set(sessionHistory.map((s) => s.branchId).filter(Boolean)).size,
          duration: Date.now() - sessionHistory[0].timestamp
        }
      : undefined

    const result = {
      success: true,
      step: {
        thought,
        thoughtNumber,
        totalThoughts,
        nextThoughtNeeded,
        ...(isRevision && { isRevision, revisesThought }),
        ...(branchId && { branchId, branchFromThought })
      },
      progress,
      analysis,
      ...(context && { context }),
      suggestions: generateSuggestions(step, analysis)
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Generate helpful suggestions based on thinking step
 */
function generateSuggestions(
  step: ThinkingStep,
  analysis: any
): { type: string; message: string }[] {
  const suggestions: { type: string; message: string }[] = []

  if (analysis.isInitial) {
    suggestions.push({
      type: 'planning',
      message:
        'Consider breaking down the problem into clear sub-problems or hypotheses to investigate.'
    })
  }

  if (analysis.needsExpansion) {
    suggestions.push({
      type: 'expansion',
      message: 'Consider increasing totalThoughts estimate to accommodate deeper analysis.'
    })
  }

  if (step.thoughtNumber > step.totalThoughts) {
    suggestions.push({
      type: 'warning',
      message:
        'Current thought exceeds initial estimate. Update totalThoughts or conclude analysis.'
    })
  }

  if (analysis.isIntermediate && step.thoughtNumber > step.totalThoughts * 0.7) {
    suggestions.push({
      type: 'completion',
      message: 'Approaching end of analysis. Consider synthesizing findings soon.'
    })
  }

  if (analysis.wordCount < 20) {
    suggestions.push({
      type: 'depth',
      message: 'Consider adding more detail to this thought for deeper analysis.'
    })
  }

  if (analysis.isFinal) {
    suggestions.push({
      type: 'conclusion',
      message:
        'Final thought reached. Ensure all key findings and conclusions are clearly stated.'
    })
  }

  return suggestions
}

/**
 * Get thinking session history
 */
export function getThinkingSession(sessionId: string = 'default'): ThinkingStep[] | undefined {
  return thinkingSessions.get(sessionId)
}

/**
 * Clear thinking session
 */
export function clearThinkingSession(sessionId: string = 'default'): boolean {
  return thinkingSessions.delete(sessionId)
}

/**
 * Clear all thinking sessions
 */
export function clearAllThinkingSessions(): void {
  thinkingSessions.clear()
}
