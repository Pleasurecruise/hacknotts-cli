#!/usr/bin/env node

import { pathToFileURL } from 'node:url'

import { render } from 'ink'

import App from './app'

export { App } from './app'

// 导出 render instance 以便在应用中使用 clear() 方法
let renderInstance: ReturnType<typeof render> | null = null

export const getRenderInstance = () => renderInstance

export const runCli = async (): Promise<void> => {
  renderInstance = render(<App />, { exitOnCtrlC: false })
  await renderInstance.waitUntilExit()
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
