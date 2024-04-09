import preact from '@preact/preset-vite'
import legacy from '@vitejs/plugin-legacy'
import type {UserConfig} from 'vite'
import paths from 'vite-tsconfig-paths'

const config: UserConfig = {
  plugins: [
    preact(),
    paths(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  build: {
    assetsDir: 'static/embed/assets',
  },
}

export default config
