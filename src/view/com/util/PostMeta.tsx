import React, {memo, useCallback} from 'react'
import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native'
import {AppBskyActorDefs, ModerationDecision, ModerationUI} from '@atproto/api'
import {useQueryClient} from '@tanstack/react-query'

import {precacheProfile, usePrefetchProfileQuery} from '#/state/queries/profile'
import {usePalette} from 'lib/hooks/usePalette'
import {makeProfileLink} from 'lib/routes/links'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {niceDate} from 'lib/strings/time'
import {TypographyVariant} from 'lib/ThemeContext'
import {isAndroid, isWeb} from 'platform/detection'
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
  style?: StyleProp<ViewStyle>
}

let PostMeta = (opts: PostMetaOpts): React.ReactNode => {
  const pal = usePalette('default')
  const displayName = opts.author.displayName || opts.author.handle
  const handle = opts.author.handle
  const prefetchProfileQuery = usePrefetchProfileQuery()

  const profileLink = makeProfileLink(opts.author)
  const onPointerEnter = isWeb
    ? () => prefetchProfileQuery(opts.author.did)
    : undefined

  const queryClient = useQueryClient()
  const onBeforePress = useCallback(() => {
    precacheProfile(queryClient, opts.author)
  }, [queryClient, opts.author])

  return (
    <View style={[styles.container, opts.style]}>
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
      <View
        style={[
          a.flex,
          a.flex_row,
          a.align_end,
          {
            gap: 4,
            // 87% is about the size where our timestamp hover starts to feel right. Anything higher feels too cramped
            maxWidth: isWeb ? '87%' : '90%',
          },
        ]}>
        <ProfileHoverCard inline did={opts.author.did}>
          <Text
            numberOfLines={1}
            style={[{flexShrink: 1}, pal.textLight, opts.displayNameStyle]}>
            <TextLinkOnWebOnly
              type={opts.displayNameType || 'lg-bold'}
              style={[pal.text]}
              lineHeight={1.2}
              disableMismatchWarning
              text={
                <>
                  {sanitizeDisplayName(
                    displayName,
                    opts.moderation?.ui('displayName'),
                  )}
                </>
              }
              href={profileLink}
              onBeforePress={onBeforePress}
              onPointerEnter={onPointerEnter}
            />
            <TextLinkOnWebOnly
              type="md"
              disableMismatchWarning
              style={[pal.textLight, {flexShrink: 4}]}
              text={'\xa0' + sanitizeHandle(handle, '@')}
              href={profileLink}
              onBeforePress={onBeforePress}
              onPointerEnter={onPointerEnter}
              anchorNoUnderline
            />
          </Text>
        </ProfileHoverCard>
        {!isAndroid && (
          <Text
            type="md"
            style={pal.textLight}
            lineHeight={1.2}
            accessible={false}>
            &middot;
          </Text>
        )}
        <TimeElapsed timestamp={opts.timestamp}>
          {({timeElapsed}) => (
            <TextLinkOnWebOnly
              type="md"
              style={pal.textLight}
              lineHeight={1.2}
              text={timeElapsed}
              accessibilityLabel={niceDate(opts.timestamp)}
              title={niceDate(opts.timestamp)}
              accessibilityHint=""
              href={opts.postHref}
              onBeforePress={onBeforePress}
            />
          )}
        </TimeElapsed>
      </View>
    </View>
  )
}
PostMeta = memo(PostMeta)
export {PostMeta}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 2,
    gap: 4,
    zIndex: 1,
    flex: 1,
  },
  avatar: {
    alignSelf: 'center',
  },
  textFlex: {
    flex: isAndroid ? 1 : undefined,
    flexShrink: isAndroid ? undefined : 1,
  },
})
