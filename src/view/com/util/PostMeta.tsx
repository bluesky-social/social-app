import React, {memo} from 'react'
import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native'
import {Text} from './text/Text'
import {TextLinkOnWebOnly} from './Link'
import {niceDate} from 'lib/strings/time'
import {usePalette} from 'lib/hooks/usePalette'
import {TypographyVariant} from 'lib/ThemeContext'
import {UserAvatar} from './UserAvatar'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {isAndroid, isWeb} from 'platform/detection'
import {TimeElapsed} from './TimeElapsed'
import {makeProfileLink} from 'lib/routes/links'
import {ModerationUI} from '@atproto/api'
import {usePrefetchProfileQuery} from '#/state/queries/profile'

interface PostMetaOpts {
  author: {
    avatar?: string
    did: string
    handle: string
    displayName?: string | undefined
  }
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

  return (
    <View style={[styles.container, opts.style]}>
      {opts.showAvatar && (
        <View style={styles.avatar}>
          <UserAvatar
            avatar={opts.author.avatar}
            size={opts.avatarSize || 16}
            moderation={opts.avatarModeration}
          />
        </View>
      )}
      <View style={styles.maxWidth}>
        <TextLinkOnWebOnly
          type={opts.displayNameType || 'lg-bold'}
          style={[pal.text, opts.displayNameStyle]}
          numberOfLines={1}
          lineHeight={1.2}
          text={
            <>
              {sanitizeDisplayName(displayName)}&nbsp;
              <Text
                type="md"
                numberOfLines={1}
                lineHeight={1.2}
                style={pal.textLight}>
                {sanitizeHandle(handle, '@')}
              </Text>
            </>
          }
          href={makeProfileLink(opts.author)}
          onPointerEnter={
            isWeb ? () => prefetchProfileQuery(opts.author.did) : undefined
          }
        />
      </View>
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
          />
        )}
      </TimeElapsed>
    </View>
  )
}
PostMeta = memo(PostMeta)
export {PostMeta}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
    gap: 4,
    zIndex: 1,
    flex: 1,
  },
  avatar: {
    alignSelf: 'center',
  },
  maxWidth: {
    flex: isAndroid ? 1 : undefined,
    maxWidth: !isAndroid ? '80%' : undefined,
  },
})
