import React, {memo, useCallback} from 'react'
import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native'
import {AppBskyActorDefs, ModerationDecision, ModerationUI} from '@atproto/api'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {precacheProfile} from '#/state/queries/profile'
import {usePalette} from 'lib/hooks/usePalette'
import {makeProfileLink} from 'lib/routes/links'
import {forceLTR} from 'lib/strings/bidi'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {niceDate} from 'lib/strings/time'
import {TypographyVariant} from 'lib/ThemeContext'
import {isAndroid} from 'platform/detection'
import {atoms as a} from '#/alf'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {TextLinkOnWebOnly} from './Link'
import {Text} from './text/Text'
import {TimeElapsed} from './TimeElapsed'
import {PreviewableUserAvatar} from './UserAvatar'

interface PostMetaOpts {
  author: AppBskyActorDefs.ProfileViewBasic
  moderation: ModerationDecision | undefined
  authorHasWarning: boolean
  postHref: string
  timestamp: string
  showAvatar?: boolean
  avatarModeration?: ModerationUI
  avatarSize?: number
  displayNameType?: TypographyVariant
  displayNameStyle?: StyleProp<TextStyle>
  onOpenAuthor?: () => void
  style?: StyleProp<ViewStyle>
}

let PostMeta = (opts: PostMetaOpts): React.ReactNode => {
  const {i18n} = useLingui()

  const pal = usePalette('default')
  const displayName = sanitizeDisplayName(
    opts.author.displayName || opts.author.handle,
    opts.moderation?.ui('displayName'),
  )
  const handle = sanitizeHandle(opts.author.handle, '@')
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
    <View style={[a.flex_1, a.flex_col, {gap: 1}]}>
      <View style={[a.flex_row, a.align_end, a.gap_xs, opts.style]}>
        {opts.showAvatar && (
          <View style={styles.avatar}>
            <PreviewableUserAvatar
              size={opts.avatarSize || 16}
              profile={opts.author}
              moderation={opts.avatarModeration}
              type={opts.author.associated?.labeler ? 'labeler' : 'user'}
            />
          </View>
        )}
        <ProfileHoverCard inline did={opts.author.did}>
          <Text
            numberOfLines={1}
            style={[styles.maxWidth, pal.textLight, opts.displayNameStyle]}>
            <TextLinkOnWebOnly
              type={opts.displayNameType || 'lg-bold'}
              style={[pal.text]}
              lineHeight={1.2}
              disableMismatchWarning
              text={forceLTR(
                sanitizeDisplayName(
                  displayName,
                  opts.moderation?.ui('displayName'),
                ),
              )}
              href={profileLink}
              onBeforePress={onBeforePressAuthor}
            />
          </Text>
        </ProfileHoverCard>
        {!isAndroid && (
          <Text type="md" style={pal.textLight} accessible={false}>
            &middot;
          </Text>
        )}
        <TimeElapsed timestamp={opts.timestamp}>
          {({timeElapsed}) => (
            <TextLinkOnWebOnly
              type="md"
              style={pal.textLight}
              text={timeElapsed}
              accessibilityLabel={niceDate(i18n, opts.timestamp)}
              title={niceDate(i18n, opts.timestamp)}
              accessibilityHint=""
              href={opts.postHref}
              onBeforePress={onBeforePressPost}
            />
          )}
        </TimeElapsed>
      </View>
      <TextLinkOnWebOnly
        type="md"
        disableMismatchWarning
        style={[pal.textLight]}
        text={handle}
        href={profileLink}
        onBeforePress={onBeforePressAuthor}
        anchorNoUnderline
      />
    </View>
  )
}
PostMeta = memo(PostMeta)
export {PostMeta}

const styles = StyleSheet.create({
  avatar: {
    alignSelf: 'center',
  },
  maxWidth: {
    flex: isAndroid ? 1 : undefined,
    flexShrink: isAndroid ? undefined : 1,
  },
})
