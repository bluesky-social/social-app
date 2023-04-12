import React from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {ComAtprotoLabelDefs} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {Link} from './Link'
import {Text} from './text/Text'
import {getLabelValueGroup} from 'lib/labeling/helpers'
import {addStyle} from 'lib/styles'

export function PostContainer({
  testID,
  href,
  isMuted,
  labels,
  style,
  children,
}: React.PropsWithChildren<{
  testID?: string
  href: string
  isMuted?: boolean
  style: StyleProp<ViewStyle>
  labels: ComAtprotoLabelDefs.Label[] | undefined
}>) {
  const pal = usePalette('default')
  const [override, setOverride] = React.useState(false)
  const bg = override ? pal.viewLight : pal.view

  if (!isMuted && !labels?.length) {
    return (
      <Link testID={testID} style={style} href={href} noFeedback>
        {children}
      </Link>
    )
  }

  const label = labels?.[0] // TODO use config to settle on most relevant item
  const labelGroup = getLabelValueGroup(label?.val || '')
  if (labelGroup.id === 'illegal') {
    return <></>
  }

  return (
    <>
      <View style={[styles.description, bg, pal.border]}>
        <FontAwesomeIcon
          icon={['far', 'eye-slash']}
          style={[styles.icon, pal.text]}
        />
        <Text type="md" style={pal.textLight}>
          {isMuted ? (
            <>Post from an account you muted.</>
          ) : label ? (
            <>Warning: {labelGroup.title}</>
          ) : (
            ''
          )}
        </Text>
        <TouchableOpacity
          style={styles.showBtn}
          onPress={() => setOverride(v => !v)}>
          <Text type="md" style={pal.link}>
            {override ? 'Hide' : 'Show'} post
          </Text>
        </TouchableOpacity>
      </View>
      {override && (
        <View style={[styles.childrenContainer, pal.border, bg]}>
          <Link
            testID={testID}
            style={addStyle(style, styles.child)}
            href={href}
            noFeedback>
            {children}
          </Link>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  description: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderTopWidth: 1,
  },
  icon: {
    marginRight: 10,
  },
  showBtn: {
    marginLeft: 'auto',
  },
  childrenContainer: {
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  child: {
    borderWidth: 1,
    borderRadius: 12,
  },
})
