import {resolve} from 'node:path'

// @ts-expect-error - not important
import preactRefresh from '@prefresh/vite'
import type {UserConfig} from 'vite'
import paths from 'vite-tsconfig-paths'

const config: UserConfig = {
  jsx: {
    factory: 'h',
    fragment: 'Fragment',
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  plugins: [preactRefresh(), paths()],
  assetsDir: 'static/embed/assets',
}

export default config
