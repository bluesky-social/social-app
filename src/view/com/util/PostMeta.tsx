import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from './text/Text'
import {DesktopWebTextLink} from './Link'
import {niceDate} from 'lib/strings/time'
import {usePalette} from 'lib/hooks/usePalette'
import {UserAvatar} from './UserAvatar'
import {observer} from 'mobx-react-lite'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {isAndroid} from 'platform/detection'
import {TimeElapsed} from './TimeElapsed'
import {makeProfileLink} from 'lib/routes/links'

interface PostMetaOpts {
  author: {
    avatar?: string
    did: string
    handle: string
    displayName?: string | undefined
  }
  showAvatar?: boolean
  authorHasWarning: boolean
  postHref: string
  timestamp: string
}

export const PostMeta = observer(function (opts: PostMetaOpts) {
  const pal = usePalette('default')
  const displayName = opts.author.displayName || opts.author.handle
  const handle = opts.author.handle

  return (
    <View style={styles.metaOneLine}>
      {opts.showAvatar && typeof opts.author.avatar !== 'undefined' && (
        <View style={styles.avatar}>
          <UserAvatar
            avatar={opts.author.avatar}
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
          <DesktopWebTextLink
            type="md"
            style={pal.textLight}
            lineHeight={1.2}
            text={timeElapsed}
            accessibilityLabel={niceDate(opts.timestamp)}
            accessibilityHint=""
            href={opts.postHref}
          />
        )}
      </TimeElapsed>
    </View>
  )
})

const styles = StyleSheet.create({
  metaOneLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingBottom: 2,
    gap: 4,
  },
  avatar: {
    alignSelf: 'center',
  },
  maxWidth: {
    flex: isAndroid ? 1 : undefined,
    maxWidth: !isAndroid ? '80%' : undefined,
  },
})
