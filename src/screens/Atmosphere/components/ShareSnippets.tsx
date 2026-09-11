import {useState} from 'react'
import {View} from 'react-native'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {getSharePostHref} from '#/screens/Atmosphere/relationships'
import {
  type ActivityActor,
  type ActivityItem,
  type AssociatedRecords,
  isShareRecord,
  type ShareRecord,
} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import {Button, ButtonText} from '#/components/Button'
import {Link, useLink} from '#/components/Link'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {ActivityActorLine} from './ActivityPrimitives'

type Share = {
  activity: ActivityItem
  actor: ActivityActor
}

const INITIAL_SHARE_COUNT = 2

export function ShareSnippets({
  shares,
  associatedRecords,
  showActorMetadata = true,
}: {
  shares: Share[]
  associatedRecords: AssociatedRecords
  showActorMetadata?: boolean
}) {
  const {t: l} = useLingui()
  const [expanded, setExpanded] = useState(false)
  const validShares = shares.flatMap(share => {
    const record = associatedRecords[share.activity.record.uri]?.record
    const href = getSharePostHref(share.activity, share.actor)
    return isShareRecord(record) && href ? [{...share, record, href}] : []
  })
  if (validShares.length === 0) return null

  const visibleShares = expanded
    ? validShares
    : validShares.slice(0, INITIAL_SHARE_COUNT)
  const remainingCount = validShares.length - INITIAL_SHARE_COUNT
  const hasOverflow = remainingCount > 0

  return (
    <View style={[a.gap_xs]}>
      {visibleShares.map(share => (
        <ShareSnippet
          key={share.activity.record.uri}
          share={share}
          showActorMetadata={showActorMetadata}
        />
      ))}
      {hasOverflow ? (
        <Button
          testID={
            expanded ? 'atmosphereShareCollapse' : 'atmosphereShareExpand'
          }
          size="tiny"
          color="secondary"
          shape="rectangular"
          label={
            expanded
              ? l`Show fewer posts`
              : l`${plural(remainingCount, {
                  one: '# more post',
                  other: '# more posts',
                })}`
          }
          onPress={() => setExpanded(value => !value)}>
          <ButtonText>
            {expanded
              ? l`Show fewer posts`
              : l`${plural(remainingCount, {
                  one: '# more post',
                  other: '# more posts',
                })}`}
          </ButtonText>
        </Button>
      ) : null}
    </View>
  )
}

type ValidShare = Share & {
  record: ShareRecord
  href: string
}

function ShareSnippet({
  share,
  showActorMetadata,
}: {
  share: ValidShare
  showActorMetadata: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {onPress: openThread} = useLink({
    to: share.href,
    displayText: l`View post`,
  })
  /*
   * This raw sidecar excerpt is not a hydrated post view. It lacks normal
   * moderation/server labels and viewer state; that limitation is accepted
   * for this prototype. Do not add post controls or claim hydrated behavior.
   */
  const richText = new RichTextAPI({
    text: share.record.text,
    facets: share.record.facets,
  })
  const emojiOnly = !richText.facets?.length && isOnlyEmoji(richText.text)

  return (
    <View testID="atmosphereShareSnippet" style={[a.gap_xs]}>
      {showActorMetadata ? (
        <ActivityActorLine
          actors={[share.actor]}
          action={l`shared`}
          timestamp={share.activity.record.indexedAt}
          showAvatars={false}
        />
      ) : null}
      {share.record.text.trim() ? (
        <Button
          role="link"
          accessibilityRole="link"
          testID="atmosphereShareQuote"
          label={share.record.text}
          style={[
            a.w_full,
            a.justify_start,
            a.rounded_md,
            a.p_md,
            t.atoms.bg_contrast_50,
          ]}
          onPress={event => {
            if (!event.defaultPrevented) openThread(event)
          }}>
          {emojiOnly ? (
            <Text
              testID="atmosphereShareText"
              emoji
              numberOfLines={4}
              style={[a.text_sm, a.leading_snug, t.atoms.text]}>
              {share.record.text}
            </Text>
          ) : (
            <RichText
              testID="atmosphereShareText"
              value={richText}
              enableTags
              authorHandle={share.actor.handle}
              shouldProxyLinks
              onLinkPress={event => {
                event.preventDefault()
              }}
              numberOfLines={4}
              style={[a.text_sm, a.leading_snug, a.italic, t.atoms.text]}
            />
          )}
        </Button>
      ) : (
        <Link to={share.href} label={l`View post`} style={[a.justify_start]}>
          <Text style={[a.text_xs, a.font_semi_bold]}>{l`View post`}</Text>
        </Link>
      )}
    </View>
  )
}
