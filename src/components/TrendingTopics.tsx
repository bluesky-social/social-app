import {useMemo} from 'react'
import {type AppBskyUnspeccedDefs, type AtUri} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
// import {makeProfileLink} from '#/lib/routes/links'
// import {feedUriToHref} from '#/lib/strings/url-helpers'
import {native} from '#/alf'
import {Link as InternalLink, type LinkProps} from '#/components/Link'

export function TrendingTopicLink({
  topic: raw,
  children,
  ...rest
}: {
  topic: AppBskyUnspeccedDefs.TrendView
} & Omit<LinkProps, 'to' | 'label'>) {
  const topic = useTopic(raw)

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
  raw: AppBskyUnspeccedDefs.TrendView,
): ParsedTrendingTopic {
  const {_} = useLingui()
  return useMemo(() => {
    const {topic: displayName, link} = raw

    if (link.startsWith('/search')) {
      return {
        type: 'topic',
        label: _(msg`Browse posts about ${displayName}`),
        displayName,
        uri: undefined,
        url: link,
      }
    } else if (link.startsWith('/hashtag')) {
      return {
        type: 'tag',
        label: _(msg`Browse posts tagged with ${displayName}`),
        displayName,
        // displayName: displayName.replace(/^#/, ''),
        uri: undefined,
        url: link,
      }
    } else if (link.startsWith('/starter-pack')) {
      return {
        type: 'starter-pack',
        label: _(msg`Browse starter pack ${displayName}`),
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
      label: _(msg`Browse topic ${displayName}`),
      displayName,
      uri: undefined,
      url: link,
    }
  }, [_, raw])
}
