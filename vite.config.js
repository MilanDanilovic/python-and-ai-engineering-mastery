import {defineConfig} from 'vite';
export default defineConfig({base:process.env.GITHUB_ACTIONS?'/python-and-ai-engineering-mastery/':'/',build:{rollupOptions:{output:{manualChunks(id){if(id.includes('vite/preload-helper')||id.includes('commonjsHelpers'))return 'vendor';if(/monaco-editor/.test(id))return 'editor';if(id.includes('node_modules'))return 'vendor';}}}}});
