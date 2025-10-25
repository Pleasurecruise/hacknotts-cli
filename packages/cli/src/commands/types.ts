export type Command = {
  name: string
  description: string
  aliases?: string[]
  execute: (args: string[]) => void | Promise<void>
}

export type CommandRegistry = {
  commands: Map<string, Command>
  registerCommand: (command: Command) => void
  getCommand: (name: string) => Command | undefined
  getAllCommands: () => Command[]
  executeCommand: (input: string) => boolean
}
