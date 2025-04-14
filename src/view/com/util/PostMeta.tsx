import {memo, useCallback} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {type AppBskyActorDefs, type ModerationDecision} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'
import type React from 'react'

import {makeProfileLink} from '#/lib/routes/links'
import {forceLTR} from '#/lib/strings/bidi'
import {NON_BREAKING_SPACE} from '#/lib/strings/constants'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {niceDate} from '#/lib/strings/time'
import {isAndroid} from '#/platform/detection'
import {precacheProfile} from '#/state/queries/profile'
import {atoms as a, useTheme, web} from '#/alf'
import {VerificationCheck} from '#/components/icons/VerificationCheck'
import {WebOnlyInlineLinkText} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {Text} from '#/components/Typography'
import {TimeElapsed} from './TimeElapsed'
import {PreviewableUserAvatar} from './UserAvatar'

interface PostMetaOpts {
  author: AppBskyActorDefs.ProfileViewBasic
  moderation: ModerationDecision | undefined
  postHref: string
  timestamp: string
  showAvatar?: boolean
  avatarSize?: number
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

  const timestampLabel = niceDate(i18n, opts.timestamp)

  // TODO
  const isVerified = false

  return (
    <View
      style={[
        a.flex_1,
        a.flex_row,
        a.align_center,
        a.pb_2xs,
        a.gap_xs,
        a.z_20,
        opts.style,
      ]}>
      {opts.showAvatar && (
        <View style={[a.self_center, a.mr_2xs]}>
          <PreviewableUserAvatar
            size={opts.avatarSize || 16}
            profile={opts.author}
            moderation={opts.moderation?.ui('avatar')}
            type={opts.author.associated?.labeler ? 'labeler' : 'user'}
          />
        </View>
      )}
      <View style={[a.flex_row, a.align_end, a.flex_shrink]}>
        <ProfileHoverCard inline did={opts.author.did}>
          <View style={[a.flex_row, a.align_end, a.flex_shrink]}>
            <WebOnlyInlineLinkText
              emoji
              numberOfLines={1}
              to={profileLink}
              label={_(msg`View profile`)}
              disableMismatchWarning
              onPress={onBeforePressAuthor}
              style={[
                a.text_md,
                a.font_bold,
                t.atoms.text,
                a.leading_tight,
                {maxWidth: '70%', flexShrink: 0},
              ]}>
              {forceLTR(
                sanitizeDisplayName(
                  displayName,
                  opts.moderation?.ui('displayName'),
                ),
              )}
            </WebOnlyInlineLinkText>
            {isVerified && (
              <View style={[a.pl_xs, a.self_center]}>
                <VerificationCheck width={14} />
              </View>
            )}
            <WebOnlyInlineLinkText
              numberOfLines={1}
              to={profileLink}
              label={_(msg`View profile`)}
              disableMismatchWarning
              disableUnderline
              onPress={onBeforePressAuthor}
              style={[
                a.text_md,
                t.atoms.text_contrast_medium,
                a.leading_tight,
                {flexShrink: 10},
              ]}>
              {NON_BREAKING_SPACE + sanitizeHandle(handle, '@')}
            </WebOnlyInlineLinkText>
          </View>
        </ProfileHoverCard>

        <TimeElapsed timestamp={opts.timestamp}>
          {({timeElapsed}) => (
            <WebOnlyInlineLinkText
              to={opts.postHref}
              label={timestampLabel}
              title={timestampLabel}
              disableMismatchWarning
              disableUnderline
              onPress={onBeforePressPost}
              style={[
                a.pl_xs,
                a.text_md,
                a.leading_tight,
                isAndroid && a.flex_grow,
                a.text_right,
                t.atoms.text_contrast_medium,
                web({
                  whiteSpace: 'nowrap',
                }),
              ]}>
              {!isAndroid && (
                <Text
                  style={[
                    a.text_md,
                    a.leading_tight,
                    t.atoms.text_contrast_medium,
                  ]}
                  accessible={false}>
                  &middot;{' '}
                </Text>
              )}
              {timeElapsed}
            </WebOnlyInlineLinkText>
          )}
        </TimeElapsed>
      </View>
    </View>
  )
}
PostMeta = memo(PostMeta)
export {PostMeta}
