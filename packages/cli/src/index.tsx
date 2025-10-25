#!/usr/bin/env node

import { render } from 'ink'
import { pathToFileURL } from 'node:url'

import App from './app'

export { App } from './app'

export const runCli = async (): Promise<void> => {
  await render(<App />).waitUntilExit()
}

const isDirectExecution = (() => {
  const nodeProcess = (globalThis as unknown as { process?: { argv?: string[] } }).process

  if (!nodeProcess?.argv || nodeProcess.argv.length < 2) {
    return false
  }

  const entry = nodeProcess.argv[1]
  if (typeof entry !== 'string') {
    return false
  }

  try {
    // Check if it's the direct file or a bin command (hacknotts)
    return pathToFileURL(entry).href === import.meta.url ||
           entry.includes('hacknotts') ||
           entry.endsWith('index.mjs') ||
           entry.endsWith('index.js')
  } catch {
    return false
  }
})()

if (isDirectExecution) {
  runCli().catch((error: unknown) => {
    console.error(error)
    const nodeProcess = (globalThis as unknown as { process?: { exitCode?: number } }).process
    if (nodeProcess) {
      nodeProcess.exitCode = 1
    }
  })
}

export default App
