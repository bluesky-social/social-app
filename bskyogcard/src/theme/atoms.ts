import {atoms as baseAtoms} from '@bsky.app/alf'

export const atoms = {
  ...baseAtoms,
  inline_block: {
    display: 'inline-block',
  },
  text_overflow_ellipsis: {
    textOverflow: 'ellipsis',
  },
  text_overflow_clip: {
    textOverflow: 'clip',
  },
  line_clamp_1: {
    display: 'block',
    lineClamp: 1,
  },
  line_clamp_2: {
    display: 'block',
    lineClamp: 2,
  },
  line_clamp_3: {
    display: 'block',
    lineClamp: 3,
  },
  line_clamp_4: {
    display: 'block',
    lineClamp: 4,
  },
} as const
