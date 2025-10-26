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
    splitting: false, // Disable code splitting to avoid shared chunks
    treeshake: true,  // Keep tree shaking for optimization
    external: [
        'yoga-wasm-web',
        'react-devtools-core',
        'ink',
        'react',
        /^@ai-sdk\//,
        /^@openrouter\//,
        // Workspace packages - treated as external for modular builds
        '@cherrystudio/ai-core',
        /^@cherrystudio\/ai-core\//,
        'toolkit',
        /^@modelcontextprotocol\//,
        'ai',
        'zod',
        'dotenv'
    ]
})
