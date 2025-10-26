import { useMemo } from 'react'

import type { CommandRegistry } from '../commands'
import { createAboutCommand, createCdCommand, createClearCommand, createCommandRegistry,createExitCommand, createExportCommand, createHelpCommand, createInitCommand, createModelCommand, createProviderCommand } from '../commands'
import type { Message, StatusBarController } from '../components/ChatInterface'

export type UseCommandRegistryOptions = {
  onShowProviders: () => void
  onShowAbout: () => void
  onRequestExit: () => void
  onShowGoodbyeMessage: (message: string) => void
  getClearHandler: () => (() => void) | undefined
  getMessagesHandler: () => (() => Message[]) | undefined
  getStatusBarController: () => StatusBarController | undefined
  getModelSwitcher?: () => ((modelName?: string) => void) | undefined
  getCdHandler?: () => ((directory?: string) => void) | undefined
}

export const useCommandRegistry = ({
  onShowProviders,
  onShowAbout,
  onRequestExit,
  onShowGoodbyeMessage,
  getClearHandler,
  getMessagesHandler,
  getStatusBarController,
  getModelSwitcher,
  getCdHandler
}: UseCommandRegistryOptions): CommandRegistry => {
  return useMemo(() => {
    const registry = createCommandRegistry()

    // 按照 builtInCommands.ts 中的函数定义顺序注册命令
    registry.registerCommand(createProviderCommand(onShowProviders))
    
    // 创建模型切换命令
    registry.registerCommand(createModelCommand(
      (modelName) => {
        const switcher = getModelSwitcher?.()
        if (switcher) {
          switcher(modelName)
        }
      },
      (message) => {
        // Error message
        const statusBar = getStatusBarController()
        if (statusBar) {
          statusBar.showError(message)
        }
      }
    ))

    // 创建工作目录切换命令
    registry.registerCommand(createCdCommand(
      (directory) => {
        const handler = getCdHandler?.()
        if (handler) {
          handler(directory)
        }
      },
      (message) => {
        // Error message
        const statusBar = getStatusBarController()
        if (statusBar) {
          statusBar.showError(message)
        }
      }
    ))

    registry.registerCommand(createClearCommand(() => {
      const handler = getClearHandler()
      if (handler) {
        handler()
      }
    }))
    
    // 创建导出命令，使用状态栏来显示消息
    registry.registerCommand(createExportCommand(
      () => {
        const handler = getMessagesHandler()
        return handler ? handler() : []
      },
      (message) => {
        // Success message
        const statusBar = getStatusBarController()
        if (statusBar) {
          statusBar.showSuccess(message, 0)
        }
      },
      (message) => {
        // Error message
        const statusBar = getStatusBarController()
        if (statusBar) {
          statusBar.showError(message)
        }
      }
    ))

    // 创建初始化命令
    registry.registerCommand(createInitCommand(
      (message) => {
        // Success message
        const statusBar = getStatusBarController()
        if (statusBar) {
          statusBar.showSuccess(message, 0)
        }
      },
      (message) => {
        // Error message
        const statusBar = getStatusBarController()
        if (statusBar) {
          statusBar.showError(message)
        }
      }
    ))

    // Help命令现在在ChatInterface中直接处理，这里只需要注册一个空的回调
    registry.registerCommand(createHelpCommand(() => {}))
    
    // About命令现在在ChatInterface中直接处理，这里只需要注册一个空的回调
    registry.registerCommand(createAboutCommand(() => {}))
    
    registry.registerCommand(createExitCommand(onRequestExit, onShowGoodbyeMessage))

    return registry
  }, [getClearHandler, getMessagesHandler, getStatusBarController, getModelSwitcher, getCdHandler, onRequestExit, onShowGoodbyeMessage, onShowProviders, onShowAbout])
}
