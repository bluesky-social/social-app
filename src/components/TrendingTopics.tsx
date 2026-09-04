import {useEffect, useMemo} from 'react'
import {type AtUri} from '@atproto/syntax'
import {Trans, useLingui} from '@lingui/react/macro'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useCallOnce} from '#/lib/once'
// import {makeProfileLink} from '#/lib/routes/links'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {atoms as a, native, useTheme} from '#/alf'
import {Link as InternalLink, type LinkProps} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {type Metrics, useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {type app} from '#/lexicons'

export function TrendingTopicsPrompt({
  control,
  onConfirm,
}: {
  control: Prompt.PromptControlProps
  onConfirm: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <Prompt.Outer control={control} testID="trendingTopicsPrompt">
      <Prompt.Content>
        <Prompt.TitleText>
          <Trans>Trending topics</Trans>
        </Prompt.TitleText>
        <Prompt.DescriptionText>
          <Trans>
            Trending topics are based on what people are talking about on the
            network. Topic titles and descriptions are generated with AI.
          </Trans>
        </Prompt.DescriptionText>
      </Prompt.Content>
      <Prompt.Actions>
        <Prompt.Action
          cta={l`Hide trending topics`}
          color="secondary"
          onPress={onConfirm}
        />
        <Text
          style={[
            a.text_sm,
            IS_WEB ? a.text_left : a.text_center,
            t.atoms.text_contrast_medium,
            a.py_xs,
          ]}>
          <Trans>You can update this later from your settings.</Trans>
        </Text>
        <Prompt.Cancel cta={l`Close`} />
      </Prompt.Actions>
    </Prompt.Outer>
  )
}

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
  const feedUri = getTrendingTopicFeedUri(raw)
  useTrendingTopicSeen(metricContext, feedUri, rank, recId)

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
  feedUri: string | undefined,
  rank: number,
  recId?: string,
  feedSliceIndex?: number,
) {
  const ax = useAnalytics()
  const trackSeen = useCallOnce(() => {
    ax.metric('trendingTopic:seen', {
      context,
      feedUri,
      rank,
      feedSliceIndex,
      recId,
    })
  })

  useEffect(() => {
    trackSeen()
  }, [trackSeen])
}

export function getTrendingTopicFeedUri(
  topic: app.bsky.unspecced.defs.TrendView,
): string | undefined {
  const match = topic.link.match(/^\/profile\/([^/]+)\/feed\/([^/?#]+)/)

  if (!match) return undefined

  return makeRecordUri(
    decodeURIComponent(match[1]),
    'app.bsky.feed.generator',
    decodeURIComponent(match[2]),
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
        label: l`Browse Starter Pack ${displayName}`,
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
