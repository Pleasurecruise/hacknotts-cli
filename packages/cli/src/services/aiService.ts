/**
 * AI Service - Manages AI Provider initialization and conversations
 * Uses @cherrystudio/ai-core for AI interactions
 */
import { config } from 'dotenv'
import { createExecutor, createPromptToolUsePlugin } from '@cherrystudio/ai-core'
import { createAndRegisterProvider } from '@cherrystudio/ai-core/provider'
import type { ProviderId } from '@cherrystudio/ai-core/provider'
import { createMcpPlugin } from 'toolkit'

// Load environment variables (from .env file or system environment)
config({ path: '.env', debug: false })

/**
 * AI Provider Interface
 */
export interface AIConfig {
  providerId: ProviderId
  model: string
  apiKey: string
  baseURL?: string
  useCompatibleMode?: boolean
}

/**
 * Check if OpenAI Compatible mode should be used
 */
function shouldUseCompatibleMode(baseURL?: string): boolean {
  if (!baseURL) return false

  // Official OpenAI API doesn't need compatible mode
  if (baseURL.includes('api.openai.com')) return false

  // All other custom URLs use compatible mode
  return true
}

/**
 * Get all configured Providers from environment variables
 * @returns Array of all configured Providers
 */
export function getAllAIConfigsFromEnv(): AIConfig[] {
  const configs: AIConfig[] = []

  // Check OpenAI configuration
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (openaiApiKey) {
    const baseURL = process.env.OPENAI_BASE_URL
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const useCompatibleMode = shouldUseCompatibleMode(baseURL)

    configs.push({
      providerId: useCompatibleMode ? ('openai-compatible' as ProviderId) : ('openai' as ProviderId),
      model,
      apiKey: openaiApiKey,
      baseURL,
      useCompatibleMode
    })
  }

  // Check Anthropic configuration
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  if (anthropicApiKey) {
    configs.push({
      providerId: 'anthropic' as ProviderId,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      apiKey: anthropicApiKey,
      baseURL: process.env.ANTHROPIC_BASE_URL
    })
  }

  // Check DeepSeek configuration
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY
  if (deepseekApiKey) {
    configs.push({
      providerId: 'deepseek' as ProviderId,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      apiKey: deepseekApiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL
    })
  }

  // Check Google configuration
  const googleApiKey = process.env.GOOGLE_API_KEY
  if (googleApiKey) {
    configs.push({
      providerId: 'google' as ProviderId,
      model: process.env.GOOGLE_MODEL || 'gemini-1.5-flash',
      apiKey: googleApiKey,
      baseURL: process.env.GOOGLE_BASE_URL
    })
  }

  return configs
}

/**
 * Get Provider configuration from environment variables (returns the first one found)
 * @deprecated Use getAllAIConfigsFromEnv() and initializeAllProviders() instead
 */
export function getAIConfigFromEnv(): AIConfig | null {
  const configs = getAllAIConfigsFromEnv()
  return configs.length > 0 ? configs[0] : null
}

/**
 * Initialize all configured AI Providers
 * @returns Array of successfully initialized configurations
 */
export async function initializeAllProviders(): Promise<AIConfig[]> {
  const allConfigs = getAllAIConfigsFromEnv()

  if (allConfigs.length === 0) {
    // console.error('❌ No valid AI provider configuration found in environment variables.')
    // console.error('Please set one of the following in your .env file or system environment:')
    // console.error('  - OPENAI_API_KEY')
    // console.error('  - ANTHROPIC_API_KEY')
    // console.error('  - DEEPSEEK_API_KEY')
    // console.error('  - GOOGLE_API_KEY')
    return []
  }

  const initialized: AIConfig[] = []

  // console.log(`🔄 Initializing ${allConfigs.length} provider(s)...`)

  for (const aiConfig of allConfigs) {
    try {
      // Prepare provider options
      const providerOptions: any = {
        apiKey: aiConfig.apiKey
      }

      // Add baseURL to options if custom baseURL exists
      if (aiConfig.baseURL) {
        providerOptions.baseURL = aiConfig.baseURL
      }

      // Create and register Provider
      const success = await createAndRegisterProvider(aiConfig.providerId, providerOptions)

      if (!success) {
        console.error(`❌ Failed to register ${aiConfig.providerId} provider`)
        continue
      }

      const displayName = aiConfig.useCompatibleMode
        ? `${aiConfig.providerId} (${aiConfig.baseURL})`
        : aiConfig.providerId

      // console.log(`✅ Successfully initialized ${displayName} provider`)
      // console.log(`   Model: ${aiConfig.model}`)
      // if (aiConfig.useCompatibleMode) {
      //   console.log(`   Mode: OpenAI-Compatible`)
      // }

      initialized.push(aiConfig)
    } catch (error) {
      console.error(`❌ Failed to initialize ${aiConfig.providerId} provider:`, error)
    }
  }

  // if (initialized.length > 0) {
  //   console.log(`\n🎉 Successfully initialized ${initialized.length} provider(s)`)
  // }

  return initialized
}

/**
 * Initialize AI Provider (returns the first successfully initialized one)
 * @deprecated Use initializeAllProviders() instead
 */
export async function initializeAIProvider(): Promise<AIConfig | null> {
  const initialized = await initializeAllProviders()
  return initialized.length > 0 ? initialized[0] : null
}

/**
 * Create AI chat stream
 * Returns streaming text using async generator
 */
export async function* streamAIChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  aiConfig: AIConfig
): AsyncGenerator<string, void, unknown> {
  try {
    // Create MCP plugin (with built-in fetch tool)
    const mcpPlugin = createMcpPlugin({
      verbose: false,
      toolPrefix: false
    })

    // Create tool use handling plugin
    const toolUsePlugin = createPromptToolUsePlugin({
      verbose: false
    })

    // Create executor
    const executor = createExecutor(
      aiConfig.providerId,
      {
        apiKey: aiConfig.apiKey,
        ...(aiConfig.baseURL && { baseURL: aiConfig.baseURL })
      } as any,
      [mcpPlugin, toolUsePlugin] // Add plugins: MCP tools + tool use handling
    )

    // Call streaming text generation
    const result = await executor.streamText({
      model: aiConfig.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    // Stream text response
    for await (const chunk of result.textStream) {
      yield chunk
    }
  } catch (error) {
    console.error('❌ Error in AI chat stream:', error)
    throw error
  }
}

/**
 * Generate AI Response
 */
export async function generateAIResponse(
  userMessage: string,
  aiConfig: AIConfig
): Promise<string> {
  try {
    // Create MCP plugin (with built-in fetch tool)
    const mcpPlugin = createMcpPlugin({
      verbose: false,
      toolPrefix: false
    })

    // Create tool use handling plugin
    const toolUsePlugin = createPromptToolUsePlugin({
      verbose: false
    })

    const executor = createExecutor(
      aiConfig.providerId,
      {
        apiKey: aiConfig.apiKey,
        ...(aiConfig.baseURL && { baseURL: aiConfig.baseURL })
      } as any,
      [mcpPlugin, toolUsePlugin]
    )

    const result = await executor.generateText({
      model: aiConfig.model,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    })

    return result.text
  } catch (error) {
    console.error('❌ Error generating AI response:', error)
    throw error
  }
}
