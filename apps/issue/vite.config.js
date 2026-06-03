import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { brandHtmlPlugin, loadBrandConfig, resolveBrand } from '../../infra/vite/brand.mjs'

// Feedback app is deployed under /feedback/. It shares the brand viewer
// publicDir (which carries the viewer .htaccess), so we overwrite the copied
// .htaccess at the very end of the build with feedback-appropriate rules,
// including a real 404 → branded feedback 404 page (Issue #1).
const FEEDBACK_HTACCESS = `# Feedback app deployed under /feedback/.
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /feedback/

  # Serve existing files/directories directly (assets, 404.html, etc.).
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Custom 404 document for unknown paths.
  ErrorDocument 404 /feedback/404.html

  # Root of the feedback app.
  RewriteRule ^$ index.html [L]
</IfModule>
`

function feedbackHtaccessPlugin(outDir) {
  return {
    name: 'feedback-htaccess',
    apply: 'build',
    closeBundle() {
      writeFileSync(resolve(outDir, '.htaccess'), FEEDBACK_HTACCESS)
    },
  }
}

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')

export default defineConfig(async () => {
  const brandName = resolveBrand()
  const brand = await loadBrandConfig(brandName, repoRoot)
  const brandDir = resolve(repoRoot, 'brands', brandName)
  const publicDir = resolve(brandDir, 'viewer', 'public')
  const outDir = resolve(here, 'dist')

  return {
    appType: 'spa',
    base: '/feedback/',
    publicDir,
    resolve: {
      alias: {
        '@brand': brandDir,
      },
    },
    define: {
      __BRAND__: JSON.stringify(brandName),
      'import.meta.env.VITE_API_BASE': JSON.stringify(brand.apiBase || '/api'),
    },
    plugins: [brandHtmlPlugin(brand), feedbackHtaccessPlugin(outDir)],
    server: {
      port: 5176,
      strictPort: true,
    },
    preview: {
      port: 5176,
      strictPort: true,
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(here, 'index.html'),
          notFound: resolve(here, '404.html'),
        },
      },
    },
  }
})

