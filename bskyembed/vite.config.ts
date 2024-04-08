import preact from '@preact/preset-vite'
import type {UserConfig} from 'vite'
import paths from 'vite-tsconfig-paths'

const config: UserConfig = {
  plugins: [preact(), paths()],
  build: {
    assetsDir: 'static/embed/assets',
  },
}

export default config
