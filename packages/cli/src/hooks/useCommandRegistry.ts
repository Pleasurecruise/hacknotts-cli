import { useMemo } from 'react'
import { createClearCommand, createCommandRegistry, createExitCommand, createHelpCommand, createProviderCommand, createExportCommand } from '../commands'
import type { CommandRegistry } from '../commands'
import type { Message, StatusBarController } from '../components/ChatInterface'

export type UseCommandRegistryOptions = {
  onShowProviders: () => void
  onRequestExit: () => void
  onShowGoodbyeMessage: (message: string) => void
  getClearHandler: () => (() => void) | undefined
  getMessagesHandler: () => (() => Message[]) | undefined
  getStatusBarController: () => StatusBarController | undefined
}

export const useCommandRegistry = ({
  onShowProviders,
  onRequestExit,
  onShowGoodbyeMessage,
  getClearHandler,
  getMessagesHandler,
  getStatusBarController
}: UseCommandRegistryOptions): CommandRegistry => {
  return useMemo(() => {
    const registry = createCommandRegistry()

    registry.registerCommand(createProviderCommand(onShowProviders))
    // Help命令现在在ChatInterface中直接处理，这里只需要注册一个空的回调
    registry.registerCommand(createHelpCommand(() => {}))
    registry.registerCommand(createClearCommand(() => {
      const handler = getClearHandler()
      if (handler) {
        handler()
      }
    }))
    registry.registerCommand(createExitCommand(onRequestExit, onShowGoodbyeMessage))
    
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

    return registry
  }, [getClearHandler, getMessagesHandler, getStatusBarController, onRequestExit, onShowGoodbyeMessage, onShowProviders])
}
