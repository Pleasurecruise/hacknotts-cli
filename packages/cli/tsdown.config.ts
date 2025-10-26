import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: {
        index: 'src/index.tsx'
    },
    outDir: 'dist',
    format: ['esm'],
    clean: true,
    dts: true,
    tsconfig: 'tsconfig.json'
})
