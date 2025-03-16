import {ParsedQs} from 'qs'

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

export function getRenderOptions(options: DisplayOptions) {
  return {
    // must match width + padding of Post.tsx
    width: options.mat ? 400 : 360,
  }
}
