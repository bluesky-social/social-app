import {useEffect, useMemo} from 'react'
import {type AtUri} from '@atproto/syntax'
import {useLingui} from '@lingui/react/macro'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useCallOnce} from '#/lib/once'
// import {makeProfileLink} from '#/lib/routes/links'
// import {feedUriToHref} from '#/lib/strings/url-helpers'
import {native} from '#/alf'
import {Link as InternalLink, type LinkProps} from '#/components/Link'
import {type Metrics, useAnalytics} from '#/analytics'
import {type app} from '#/lexicons'

export function TrendingTopicLink({
  topic: raw,
  metricContext,
  rank,
  recId,
  children,
  ...rest
}: {
  topic: app.bsky.unspecced.defs.TrendView
  metricContext: Metrics['trendingTopic:seen']['context']
  rank: number
  recId?: string
} & Omit<LinkProps, 'to' | 'label'>) {
  const topic = useTopic(raw)
  useTrendingTopicSeen(metricContext, rank, recId)

  return (
    <InternalLink
      label={topic.label}
      to={topic.url}
      PressableComponent={native(PressableScale)}
      {...rest}>
      {children}
    </InternalLink>
  )
}

export function useTrendingTopicSeen(
  context: Metrics['trendingTopic:seen']['context'],
  rank: number,
  recId?: string,
  feedSliceIndex?: number,
) {
  const ax = useAnalytics()
  const trackSeen = useCallOnce(() => {
    ax.metric('trendingTopic:seen', {
      context,
      rank,
      feedSliceIndex,
      recId,
    })
  })

  useEffect(() => {
    trackSeen()
  }, [trackSeen])
}

type ParsedTrendingTopic =
  | {
      type: 'topic' | 'tag' | 'starter-pack' | 'unknown'
      label: string
      displayName: string
      url: string
      uri: undefined
    }
  | {
      type: 'profile' | 'feed'
      label: string
      displayName: string
      url: string
      uri: AtUri
    }

export function useTopic(
  raw: app.bsky.unspecced.defs.TrendView,
): ParsedTrendingTopic {
  const {t: l} = useLingui()
  return useMemo(() => {
    const {topic: displayName, link} = raw

    if (link.startsWith('/search')) {
      return {
        type: 'topic',
        label: l`Browse posts about ${displayName}`,
        displayName,
        uri: undefined,
        url: link,
      }
    } else if (link.startsWith('/hashtag')) {
      return {
        type: 'tag',
        label: l`Browse posts tagged with ${displayName}`,
        displayName,
        // displayName: displayName.replace(/^#/, ''),
        uri: undefined,
        url: link,
      }
    } else if (link.startsWith('/starter-pack')) {
      return {
        type: 'starter-pack',
        label: l`Browse starter pack ${displayName}`,
        displayName,
        uri: undefined,
        url: link,
      }
    }

    /*
    if (!link.startsWith('at://')) {
      // above logic
    } else {
      const urip = new AtUri(link)
      switch (urip.collection) {
        case 'app.bsky.actor.profile': {
          return {
            type: 'profile',
            label: _(msg`View ${displayName}'s profile`),
            displayName,
            uri: urip,
            url: makeProfileLink({did: urip.host, handle: urip.host}),
          }
        }
        case 'app.bsky.feed.generator': {
          return {
            type: 'feed',
            label: _(msg`Browse the ${displayName} feed`),
            displayName,
            uri: urip,
            url: feedUriToHref(link),
          }
        }
      }
    }
     */

    return {
      type: 'unknown',
      label: l`Browse topic ${displayName}`,
      displayName,
      uri: undefined,
      url: link,
    }
  }, [l, raw])
}
