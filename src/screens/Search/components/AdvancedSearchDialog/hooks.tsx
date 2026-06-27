import {useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {type FilterField} from './utils'

export function useFilterFieldLabels(): Record<
  FilterField,
  {
    title: string
    label: string
  }
> {
  const {t: l} = useLingui()

  const hashtags = [
    'bluesky atproto',
    l({
      message: 'bloomscrolling booksky',
      comment: 'Advanced search: Examples of hashtags',
    }),
  ]

  // eslint-disable-next-line react/hook-use-state
  const [hashtagIndex] = useState(() =>
    Math.floor(Math.random() * hashtags.length),
  )

  return {
    authors: {
      title: l({
        message: 'From these people',
        comment: 'Advanced search filter',
      }),
      label: 'bsky.app atproto.com',
    },
    mentions: {
      title: l({
        message: 'Mentions of these people',
        comment: 'Advanced search filter',
      }),
      label: 'bsky.app atproto.com',
    },
    tags: {
      title: l({
        message: 'These hashtags',
        comment: 'Advanced search filter',
      }),
      label: hashtags[hashtagIndex],
    },
    domains: {
      title: l({
        message: 'These domains',
        comment: 'Advanced search filter',
      }),
      label: 'bsky.app atproto.com',
    },
    urls: {
      title: l({
        message: 'These URLs',
        comment: 'Advanced search filter',
      }),
      label: 'bsky.app atproto.com',
    },
  }
}
