import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from './text/Text'
import {DesktopWebTextLink} from './Link'
import {ago, niceDate} from 'lib/strings/time'
import {usePalette} from 'lib/hooks/usePalette'
import {UserAvatar} from './UserAvatar'
import {observer} from 'mobx-react-lite'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {isAndroid, isIOS} from 'platform/detection'

interface PostMetaOpts {
  authorAvatar?: string
  authorHandle: string
  authorDisplayName: string | undefined
  authorHasWarning: boolean
  postHref: string
  timestamp: string
}

export const PostMeta = observer(function (opts: PostMetaOpts) {
  const pal = usePalette('default')
  const displayName = opts.authorDisplayName || opts.authorHandle
  const handle = opts.authorHandle

  return (
    <View style={styles.metaOneLine}>
      {typeof opts.authorAvatar !== 'undefined' && (
        <View style={styles.avatar}>
          <UserAvatar
            avatar={opts.authorAvatar}
            size={16}
            // TODO moderation
          />
        </View>
      )}
      <View style={styles.maxWidth}>
        <DesktopWebTextLink
          type="lg-bold"
          style={pal.text}
          numberOfLines={1}
          lineHeight={1.2}
          text={
            <>
              {sanitizeDisplayName(displayName)}
              <Text
                type="md"
                style={[pal.textLight]}
                numberOfLines={1}
                lineHeight={1.2}>
                &nbsp;@{handle}
              </Text>
            </>
          }
          href={`/profile/${opts.authorHandle}`}
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
      <DesktopWebTextLink
        type="md"
        style={pal.textLight}
        lineHeight={1.2}
        text={ago(opts.timestamp)}
        accessibilityLabel={niceDate(opts.timestamp)}
        accessibilityHint=""
        href={opts.postHref}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  metaOneLine: {
    flexDirection: 'row',
    paddingBottom: 2,
    gap: 4,
  },
  avatar: {
    alignSelf: 'center',
  },
  maxWidth: {
    flex: isAndroid ? 1 : undefined,
    maxWidth: isIOS ? '80%' : undefined,
  },
})
