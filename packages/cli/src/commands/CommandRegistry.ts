import type { Command, CommandRegistry } from './types'

export class CommandRegistryImpl implements CommandRegistry {
  commands: Map<string, Command> = new Map()
  private aliasMap: Map<string, string> = new Map()

  registerCommand(command: Command): void {
    this.commands.set(command.name, command)
    
    // 注册别名
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliasMap.set(alias, command.name)
      }
    }
  }

  getCommand(nameOrAlias: string): Command | undefined {
    // 先检查是否是别名
    const actualName = this.aliasMap.get(nameOrAlias) || nameOrAlias
    return this.commands.get(actualName)
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values())
  }

  executeCommand(input: string): boolean {
    // 解析命令输入
    const trimmed = input.trim()
    if (!trimmed.startsWith('/')) {
      return false
    }

    // 移除开头的 /
    const commandText = trimmed.slice(1)
    
    // 分割命令名和参数
    const parts = commandText.split(/\s+/)
    const commandName = parts[0].toLowerCase()
    const args = parts.slice(1)

    // 查找并执行命令
    const command = this.getCommand(commandName)
    if (command) {
      command.execute(args)
      return true
    }

    return false
  }
}

export const createCommandRegistry = (): CommandRegistry => {
  return new CommandRegistryImpl()
}
