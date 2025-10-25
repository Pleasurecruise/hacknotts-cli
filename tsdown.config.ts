import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: {
        // CLI entry (main package)
        'cli': 'packages/cli/src/index.tsx',
        // aiCore entries
        'aiCore/index': 'packages/aiCore/src/index.ts',
        'aiCore/built-in/plugins/index': 'packages/aiCore/src/core/plugins/built-in/index.ts',
        'aiCore/provider/index': 'packages/aiCore/src/core/providers/index.ts',
        // toolkit entry
        'toolkit/index': 'packages/toolkit/src/index.ts'
    },
    outDir: 'dist',
    format: ['esm'],
    clean: true,
    dts: true,
    platform: 'node',
    external: [
        'yoga-wasm-web',
        'react-devtools-core',
        'ink',
        'react',
        /^@ai-sdk\//,
        /^@openrouter\//,
        // Note: @cherrystudio packages are workspace internal, should be bundled
        // Only external for library builds, not for CLI
        /^@modelcontextprotocol\//,
        'ai',
        'zod',
        'dotenv'
    ]
})
