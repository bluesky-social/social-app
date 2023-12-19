import React, {memo} from 'react'
import {StyleProp, TextStyle, ViewStyle} from 'react-native'
import {TextLinkOnWebOnly} from './Link'
import {niceDate} from 'lib/strings/time'
import {usePalette} from 'lib/hooks/usePalette'
import {TypographyVariant} from 'lib/ThemeContext'
import {UserAvatar} from './UserAvatar'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {isAndroid} from 'platform/detection'
import {TimeElapsed} from './TimeElapsed'
import {makeProfileLink} from 'lib/routes/links'
import {Box, Text, android, notAndroid} from '#/alf'

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
  avatarSize?: number
  displayNameType?: TypographyVariant
  displayNameStyle?: StyleProp<TextStyle>
  style?: StyleProp<ViewStyle>
}

let PostMeta = (opts: PostMetaOpts): React.ReactNode => {
  const pal = usePalette('default')
  const displayName = opts.author.displayName || opts.author.handle
  const handle = opts.author.handle

  return (
    <Box row aic pb={2} gap='xs' zIndex={1} style={[opts.style]}>
      {opts.showAvatar && (
        <Box alignSelf='center'>
          <UserAvatar
            avatar={opts.author.avatar}
            size={opts.avatarSize || 16}
            // TODO moderation
          />
        </Box>
      )}
      <Box flex={android(1)} maxWidth={notAndroid('80%')}>
        <TextLinkOnWebOnly
          type={opts.displayNameType || 'lg-bold'}
          style={[pal.text, opts.displayNameStyle]}
          numberOfLines={1}
          lineHeight={1.2}
          text={
            <>
              {sanitizeDisplayName(displayName)}&nbsp;
              <Text
                c='l4'
                fontSize='m'
                fontWeight='normal'
                numberOfLines={1}>
                {sanitizeHandle(handle, '@')}
              </Text>
            </>
          }
          href={makeProfileLink(opts.author)}
        />
      </Box>
      {!isAndroid && (
        <Text
          fontSize='m'
          style={pal.textLight}
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
    </Box>
  )
}
PostMeta = memo(PostMeta)
export {PostMeta}
