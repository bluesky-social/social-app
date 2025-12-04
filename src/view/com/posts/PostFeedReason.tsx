import {StyleSheet, View} from 'react-native'
import {AppBskyFeedDefs, type ModerationDecision} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isReasonFeedSource, type ReasonFeedSource} from '#/lib/api/feed/types'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {makeProfileLink} from '#/lib/routes/links'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Pin_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {Repost_Stroke2_Corner3_Rounded as RepostIcon} from '#/components/icons/Repost'
import {Link, WebOnlyInlineLinkText} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {Text} from '#/components/Typography'
import {FeedNameText} from '../util/FeedInfoText'

export function PostFeedReason({
  reason,
  moderation,
  onOpenReposter,
}: {
  reason:
    | ReasonFeedSource
    | AppBskyFeedDefs.ReasonRepost
    | AppBskyFeedDefs.ReasonPin
    | {[k: string]: unknown; $type: string}
  moderation?: ModerationDecision
  onOpenReposter?: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()

  const {currentAccount} = useSession()

  if (isReasonFeedSource(reason)) {
    return (
      <Link label={_(msg`Go to feed`)} to={reason.href}>
        <Text
          style={[
            t.atoms.text_contrast_medium,
            a.font_medium,
            a.leading_snug,
            a.leading_snug,
          ]}
          numberOfLines={1}>
          <Trans context="from-feed">
            From{' '}
            <FeedNameText
              uri={reason.uri}
              href={reason.href}
              style={[
                t.atoms.text_contrast_medium,
                a.font_medium,
                a.leading_snug,
              ]}
              numberOfLines={1}
            />
          </Trans>
        </Text>
      </Link>
    )
  }

  if (AppBskyFeedDefs.isReasonRepost(reason)) {
    const isOwner = reason.by.did === currentAccount?.did
    const reposter = createSanitizedDisplayName(
      reason.by,
      false,
      moderation?.ui('displayName'),
    )
    return (
      <Link
        style={styles.includeReason}
        to={makeProfileLink(reason.by)}
        label={
          isOwner ? _(msg`Reposted by you`) : _(msg`Reposted by ${reposter}`)
        }
        onPress={onOpenReposter}>
        <RepostIcon
          style={[t.atoms.text_contrast_medium, {marginRight: 3}]}
          width={13}
          height={13}
        />
        <Text
          style={[t.atoms.text_contrast_medium, a.font_medium, a.leading_snug]}
          numberOfLines={1}>
          {isOwner ? (
            <Trans>Reposted by you</Trans>
          ) : (
            <Trans>
              Reposted by{' '}
              <ProfileHoverCard did={reason.by.did}>
                <WebOnlyInlineLinkText
                  label={reposter}
                  numberOfLines={1}
                  to={makeProfileLink(reason.by)}
                  onPress={onOpenReposter}
                  style={[
                    t.atoms.text_contrast_medium,
                    a.font_medium,
                    a.leading_snug,
                  ]}
                  emoji>
                  {reposter}
                </WebOnlyInlineLinkText>
              </ProfileHoverCard>
            </Trans>
          )}
        </Text>
      </Link>
    )
  }

  if (AppBskyFeedDefs.isReasonPin(reason)) {
    return (
      <View style={styles.includeReason}>
        <PinIcon
          style={[t.atoms.text_contrast_medium, {marginRight: 3}]}
          width={13}
          height={13}
        />
        <Text
          style={[t.atoms.text_contrast_medium, a.font_medium, a.leading_snug]}
          numberOfLines={1}>
          <Trans>Pinned</Trans>
        </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  includeReason: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: -16,
  },
})
