#!/usr/bin/env node

import { cpSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..', '..') // Go up two levels: docs/scripts -> docs -> root

// Copy build files to workspace packages
const copies = [
  // CLI package
  {
    src: join(rootDir, 'dist/cli.js'),
    dest: join(rootDir, 'packages/cli/dist/index.js')
  },
  {
    src: join(rootDir, 'dist/cli.d.ts'),
    dest: join(rootDir, 'packages/cli/dist/index.d.ts')
  },
  // aiCore package
  {
    src: join(rootDir, 'dist/aiCore'),
    dest: join(rootDir, 'packages/aiCore/dist')
  },
  // toolkit package
  {
    src: join(rootDir, 'dist/toolkit'),
    dest: join(rootDir, 'packages/toolkit/dist')
  }
]

// Find and copy shared chunk files (files with hashed names like "built-in-DuYdH3rg.js")
const distFiles = readdirSync(join(rootDir, 'dist'))
const sharedChunks = distFiles.filter(file =>
  file.endsWith('.js') &&
  file.includes('-') &&
  !file.startsWith('cli') &&
  !file.startsWith('index')
)

// Add shared chunks to aiCore package (since they're mostly used by aiCore modules)
sharedChunks.forEach(chunk => {
  copies.push({
    src: join(rootDir, 'dist', chunk),
    dest: join(rootDir, 'packages/aiCore', chunk)
  })
})

console.log('📦 Copying build files to workspace packages...')
if (sharedChunks.length > 0) {
  console.log(`📦 Found ${sharedChunks.length} shared chunk(s): ${sharedChunks.join(', ')}`)
}

for (const { src, dest } of copies) {
  try {
    // Ensure destination directory exists
    const destDir = dirname(dest)
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true })
    }

    // Copy file or directory
    cpSync(src, dest, { recursive: true, force: true })
    console.log(`✅ Copied: ${src} -> ${dest}`)
  } catch (error) {
    console.error(`❌ Failed to copy ${src}:`, error.message)
  }
}

console.log('✨ Post-build complete!')
