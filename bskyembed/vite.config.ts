import fs from 'node:fs'
import {resolve} from 'node:path'

import preact from '@preact/preset-vite'
import legacy from '@vitejs/plugin-legacy'
import type {Plugin, UserConfig} from 'vite'
import paths from 'vite-tsconfig-paths'

/**
 * World's hackiest router, for dev only. Serves `/post.html` to requests that start with `/embed/`
 */
function devOnlyRouter(): Plugin {
  return {
    name: 'embed-to-post-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/embed/')) return next()

        const html = fs.readFileSync(
          resolve(process.cwd(), 'post.html'),
          'utf8',
        )

        server
          .transformIndexHtml(url, html)
          .then(transformed => {
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            res.end(transformed)
          })
          .catch(next)
      })
    },
  }
}

const config: UserConfig = {
  plugins: [
    preact(),
    paths(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    devOnlyRouter(),
  ],
  build: {
    assetsDir: 'static',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        post: resolve(__dirname, 'post.html'),
      },
    },
  },
}

export default config
