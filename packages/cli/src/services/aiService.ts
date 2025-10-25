/**
 * AI Service - 管理 AI Provider 初始化和对话
 * 使用 @cherrystudio/ai-core 进行 AI 交互
 */
import { config } from 'dotenv'
import { createExecutor, createPromptToolUsePlugin } from '@cherrystudio/ai-core'
import { createAndRegisterProvider } from '@cherrystudio/ai-core/provider'
import type { ProviderId } from '@cherrystudio/ai-core/provider'
import { createMcpPlugin } from 'toolkit'

// 加载环境变量（从 .env 文件或系统环境变量）
config({ path: '.env' })

/**
 * AI Provider 配置接口
 */
export interface AIConfig {
  providerId: ProviderId
  model: string
  apiKey: string
  baseURL?: string
  useCompatibleMode?: boolean
}

/**
 * 检查是否应该使用 OpenAI Compatible 模式
 */
function shouldUseCompatibleMode(baseURL?: string): boolean {
  if (!baseURL) return false

  // 官方 OpenAI API 不需要 compatible 模式
  if (baseURL.includes('api.openai.com')) return false

  // 其他自定义 URL 都使用 compatible 模式
  return true
}

/**
 * 从环境变量获取所有配置的 Provider
 * @returns 所有配置的 Provider 数组
 */
export function getAllAIConfigsFromEnv(): AIConfig[] {
  const configs: AIConfig[] = []

  // 检查 OpenAI 配置
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

  // 检查 Anthropic 配置
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  if (anthropicApiKey) {
    configs.push({
      providerId: 'anthropic' as ProviderId,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      apiKey: anthropicApiKey,
      baseURL: process.env.ANTHROPIC_BASE_URL
    })
  }

  // 检查 DeepSeek 配置
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY
  if (deepseekApiKey) {
    configs.push({
      providerId: 'deepseek' as ProviderId,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      apiKey: deepseekApiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL
    })
  }

  // 检查 Google 配置
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
 * 从环境变量获取 Provider 配置（返回第一个找到的）
 * @deprecated 建议使用 getAllAIConfigsFromEnv() 和 initializeAllProviders()
 */
export function getAIConfigFromEnv(): AIConfig | null {
  const configs = getAllAIConfigsFromEnv()
  return configs.length > 0 ? configs[0] : null
}

/**
 * 初始化所有配置的 AI Providers
 * @returns 成功初始化的配置数组
 */
export async function initializeAllProviders(): Promise<AIConfig[]> {
  const allConfigs = getAllAIConfigsFromEnv()

  if (allConfigs.length === 0) {
    console.error('❌ No valid AI provider configuration found in environment variables.')
    console.error('Please set one of the following in your .env file or system environment:')
    console.error('  - OPENAI_API_KEY')
    console.error('  - ANTHROPIC_API_KEY')
    console.error('  - DEEPSEEK_API_KEY')
    console.error('  - GOOGLE_API_KEY')
    return []
  }

  const initialized: AIConfig[] = []

  console.log(`🔄 Initializing ${allConfigs.length} provider(s)...`)

  for (const aiConfig of allConfigs) {
    try {
      // 准备 provider 选项
      const providerOptions: any = {
        apiKey: aiConfig.apiKey
      }

      // 如果有自定义 baseURL，添加到选项中
      if (aiConfig.baseURL) {
        providerOptions.baseURL = aiConfig.baseURL
      }

      // 创建并注册 Provider
      const success = await createAndRegisterProvider(aiConfig.providerId, providerOptions)

      if (!success) {
        console.error(`❌ Failed to register ${aiConfig.providerId} provider`)
        continue
      }

      const displayName = aiConfig.useCompatibleMode
        ? `${aiConfig.providerId} (${aiConfig.baseURL})`
        : aiConfig.providerId

      console.log(`✅ Successfully initialized ${displayName} provider`)
      console.log(`   Model: ${aiConfig.model}`)
      if (aiConfig.useCompatibleMode) {
        console.log(`   Mode: OpenAI-Compatible`)
      }

      initialized.push(aiConfig)
    } catch (error) {
      console.error(`❌ Failed to initialize ${aiConfig.providerId} provider:`, error)
    }
  }

  if (initialized.length > 0) {
    console.log(`\n🎉 Successfully initialized ${initialized.length} provider(s)`)
  }

  return initialized
}

/**
 * 初始化 AI Provider（返回第一个成功初始化的）
 * @deprecated 建议使用 initializeAllProviders()
 */
export async function initializeAIProvider(): Promise<AIConfig | null> {
  const initialized = await initializeAllProviders()
  return initialized.length > 0 ? initialized[0] : null
}

/**
 * 创建 AI 聊天流
 * 使用 async generator 返回流式文本
 */
export async function* streamAIChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  aiConfig: AIConfig
): AsyncGenerator<string, void, unknown> {
  try {
    // 创建 MCP 插件（内置 fetch 工具）
    const mcpPlugin = createMcpPlugin({
      verbose: false,
      toolPrefix: false
    })

    // 创建工具调用处理插件
    const toolUsePlugin = createPromptToolUsePlugin({
      verbose: false
    })

    // 创建执行器
    const executor = createExecutor(
      aiConfig.providerId,
      {
        apiKey: aiConfig.apiKey,
        ...(aiConfig.baseURL && { baseURL: aiConfig.baseURL })
      } as any,
      [mcpPlugin, toolUsePlugin] // 添加插件：MCP工具 + 工具调用处理
    )

    // 调用流式文本生成
    const result = await executor.streamText({
      model: aiConfig.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    // 流式返回文本
    for await (const chunk of result.textStream) {
      yield chunk
    }
  } catch (error) {
    console.error('❌ Error in AI chat stream:', error)
    throw error
  }
}

/**
 * 生成简单的 AI 响应（非流式）
 */
export async function generateAIResponse(
  userMessage: string,
  aiConfig: AIConfig
): Promise<string> {
  try {
    // 创建 MCP 插件（内置 fetch 工具）
    const mcpPlugin = createMcpPlugin({
      verbose: false,
      toolPrefix: false
    })

    // 创建工具调用处理插件
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
