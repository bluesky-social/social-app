import React, {memo, useCallback} from 'react'
import {StyleProp, TextStyle, View, ViewStyle} from 'react-native'
import {AppBskyActorDefs, ModerationDecision, ModerationUI} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {forceLTR} from '#/lib/strings/bidi'
import {NON_BREAKING_SPACE} from '#/lib/strings/constants'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {niceDate} from '#/lib/strings/time'
import {isAndroid} from '#/platform/detection'
import {precacheProfile} from '#/state/queries/profile'
import {atoms as a, useTheme} from '#/alf'
import {WebOnlyInlineLinkText} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {Text} from '#/components/Typography'
import {TimeElapsed} from './TimeElapsed'
import {PreviewableUserAvatar} from './UserAvatar'

interface PostMetaOpts {
  author: AppBskyActorDefs.ProfileViewBasic
  moderation: ModerationDecision | undefined
  /**
   * @deprecated not in use for 6+ months
   */
  authorHasWarning: boolean
  postHref: string
  timestamp: string
  showAvatar?: boolean
  avatarModeration?: ModerationUI
  avatarSize?: number
  displayNameStyle?: StyleProp<TextStyle>
  onOpenAuthor?: () => void
  style?: StyleProp<ViewStyle>
}

let PostMeta = (opts: PostMetaOpts): React.ReactNode => {
  const t = useTheme()
  const {i18n, _} = useLingui()

  const displayName = opts.author.displayName || opts.author.handle
  const handle = opts.author.handle
  const profileLink = makeProfileLink(opts.author)
  const queryClient = useQueryClient()
  const onOpenAuthor = opts.onOpenAuthor
  const onBeforePressAuthor = useCallback(() => {
    precacheProfile(queryClient, opts.author)
    onOpenAuthor?.()
  }, [queryClient, opts.author, onOpenAuthor])
  const onBeforePressPost = useCallback(() => {
    precacheProfile(queryClient, opts.author)
  }, [queryClient, opts.author])

  return (
    <View
      style={[
        a.flex_1,
        a.flex_row,
        a.align_center,
        a.pb_2xs,
        a.gap_xs,
        a.z_10,
        opts.style,
      ]}>
      {opts.showAvatar && (
        <View style={[a.self_center, a.mr_2xs]}>
          <PreviewableUserAvatar
            size={opts.avatarSize || 16}
            profile={opts.author}
            moderation={opts.avatarModeration}
            type={opts.author.associated?.labeler ? 'labeler' : 'user'}
          />
        </View>
      )}
      <ProfileHoverCard inline did={opts.author.did}>
        <Text numberOfLines={1} style={[a.flex_shrink, opts.displayNameStyle]}>
          <WebOnlyInlineLinkText
            to={profileLink}
            label={_(msg`View profile`)}
            disableMismatchWarning
            onPress={onBeforePressAuthor}>
            <Text
              emoji
              style={[a.text_md, a.font_bold, t.atoms.text, a.leading_snug]}>
              {forceLTR(
                sanitizeDisplayName(
                  displayName,
                  opts.moderation?.ui('displayName'),
                ),
              )}
            </Text>
          </WebOnlyInlineLinkText>
          <WebOnlyInlineLinkText
            to={profileLink}
            label={_(msg`View profile`)}
            disableMismatchWarning
            disableUnderline
            onPress={onBeforePressAuthor}
            style={[a.text_md, t.atoms.text_contrast_medium, a.leading_snug]}>
            {NON_BREAKING_SPACE + sanitizeHandle(handle, '@')}
          </WebOnlyInlineLinkText>
        </Text>
      </ProfileHoverCard>

      {!isAndroid && (
        <Text
          style={[a.text_md, t.atoms.text_contrast_medium]}
          accessible={false}>
          &middot;
        </Text>
      )}

      <TimeElapsed timestamp={opts.timestamp}>
        {({timeElapsed}) => (
          <WebOnlyInlineLinkText
            to={opts.postHref}
            label={niceDate(i18n, opts.timestamp)}
            title={niceDate(i18n, opts.timestamp)}
            disableMismatchWarning
            disableUnderline
            onPress={onBeforePressPost}
            style={[a.text_md, t.atoms.text_contrast_medium, a.leading_snug]}>
            {timeElapsed}
          </WebOnlyInlineLinkText>
        )}
      </TimeElapsed>
    </View>
  )
}
PostMeta = memo(PostMeta)
export {PostMeta}
