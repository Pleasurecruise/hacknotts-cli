/**
 * Configuration Service - 管理用户配置持久化
 * 保存用户偏好设置（默认提供商、模型等）
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type { ProviderId } from '@cherrystudio/ai-core/provider'

/**
 * 用户配置接口
 */
export interface UserConfig {
  /** 默认使用的提供商 ID */
  defaultProvider?: ProviderId
  /** 默认使用的模型名称 */
  defaultModel?: string
  /** 上次更新时间 */
  lastUpdated?: string
}

/**
 * 配置文件路径
 */
const CONFIG_DIR = join(homedir(), '.hacknotts-cli')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

/**
 * 确保配置目录存在
 */
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

/**
 * 读取用户配置
 * @returns 用户配置对象，如果不存在则返回空对象
 */
export function loadUserConfig(): UserConfig {
  try {
    ensureConfigDir()

    if (!existsSync(CONFIG_FILE)) {
      return {}
    }

    const content = readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(content) as UserConfig
  } catch (error) {
    // 静默失败，返回空配置
    return {}
  }
}

/**
 * 保存用户配置
 * @param config 要保存的配置对象
 */
export function saveUserConfig(config: UserConfig): boolean {
  try {
    ensureConfigDir()

    const configToSave: UserConfig = {
      ...config,
      lastUpdated: new Date().toISOString()
    }

    writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('❌ Failed to save user config:', error)
    return false
  }
}

/**
 * 更新用户配置（合并更新）
 * @param updates 要更新的配置部分
 */
export function updateUserConfig(updates: Partial<UserConfig>): boolean {
  const currentConfig = loadUserConfig()
  const newConfig = {
    ...currentConfig,
    ...updates
  }
  return saveUserConfig(newConfig)
}

/**
 * 设置默认提供商
 * @param providerId 提供商 ID
 * @param model 可选的默认模型
 */
export function setDefaultProvider(providerId: ProviderId, model?: string): boolean {
  return updateUserConfig({
    defaultProvider: providerId,
    ...(model && { defaultModel: model })
  })
}

/**
 * 获取默认提供商
 * @returns 默认提供商 ID，如果未设置则返回 undefined
 */
export function getDefaultProvider(): ProviderId | undefined {
  const config = loadUserConfig()
  return config.defaultProvider
}

/**
 * 获取默认模型
 * @returns 默认模型名称，如果未设置则返回 undefined
 */
export function getDefaultModel(): string | undefined {
  const config = loadUserConfig()
  return config.defaultModel
}

/**
 * 清除用户配置
 */
export function clearUserConfig(): boolean {
  return saveUserConfig({})
}

/**
 * 获取配置文件路径（用于调试）
 */
export function getConfigPath(): string {
  return CONFIG_FILE
}
