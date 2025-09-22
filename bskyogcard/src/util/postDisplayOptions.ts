import {ParsedQs} from 'qs'

import {getWidthWithMat} from './frameMatting.js'

export const DEFAULT_WIDTH = 360

/**
 * Options parsed from the query string, passed to the components themselves.
 */
export type DisplayOptions = {
  mat: boolean
}

export function parseDisplayOptionsFromQuery(query: ParsedQs): DisplayOptions {
  const opts: DisplayOptions = {
    mat: false,
  }

  ;['mat'].forEach(key => {
    const val = query[key]
    if (val === 'true' || val === '1') {
      opts[key] = true
    } else {
      opts[key] = false
    }
  })

  return opts
}

/**
 * Options computed from the parsed query options, passed to the render
 * function.
 */
export function getRenderOptions(options: DisplayOptions) {
  return {
    // must match width + padding of Post.tsx
    width: options.mat ? getWidthWithMat(DEFAULT_WIDTH) : DEFAULT_WIDTH,
  }
}
