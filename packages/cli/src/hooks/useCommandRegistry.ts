import { useMemo } from 'react'
import { createClearCommand, createCommandRegistry, createExitCommand, createHelpCommand, createProviderCommand } from '../commands'
import type { CommandRegistry } from '../commands'

export type UseCommandRegistryOptions = {
  onShowProviders: () => void
  onRequestExit: () => void
  onShowGoodbyeMessage: (message: string) => void
  getClearHandler: () => (() => void) | undefined
}

export const useCommandRegistry = ({
  onShowProviders,
  onRequestExit,
  onShowGoodbyeMessage,
  getClearHandler
}: UseCommandRegistryOptions): CommandRegistry => {
  return useMemo(() => {
    const registry = createCommandRegistry()

    registry.registerCommand(createProviderCommand(onShowProviders))
    registry.registerCommand(createHelpCommand(() => registry.getAllCommands()))
    registry.registerCommand(createClearCommand(() => {
      const handler = getClearHandler()
      if (handler) {
        handler()
      }
    }))
    registry.registerCommand(createExitCommand(onRequestExit, onShowGoodbyeMessage))

    return registry
  }, [getClearHandler, onRequestExit, onShowGoodbyeMessage, onShowProviders])
}
