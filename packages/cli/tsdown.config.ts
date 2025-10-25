import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: {
        index: 'src/index.tsx'
    },
    outDir: 'dist',
    format: ['esm', 'cjs'],
    clean: true,
    dts: true,
    tsconfig: 'tsconfig.json'
})
