import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { readdirSync, statSync } from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Function to find all HTML files recursively
function getHtmlFiles(dir, files = {}) {
    const items = readdirSync(dir)
    for (const item of items) {
        const fullPath = resolve(dir, item)
        if (statSync(fullPath).isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
            getHtmlFiles(fullPath, files)
        } else if (item.endsWith('.html')) {
            const name = fullPath.replace(resolve(__dirname, ''), '').replace(/^\//, '').replace('.html', '')
            files[name] = fullPath
        }
    }
    return files
}

const htmlFiles = getHtmlFiles(__dirname)

export default defineConfig({
    build: {
        rollupOptions: {
            input: htmlFiles,
        },
    },
})
