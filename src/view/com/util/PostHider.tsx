import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {ComAtprotoLabelDefs} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from './text/Text'
import {getLabelValueGroup} from 'lib/labeling/helpers'

export function PostHider({
  isMuted,
  labels,
  children,
}: React.PropsWithChildren<{
  isMuted?: boolean
  labels: ComAtprotoLabelDefs.Label[] | undefined
}>) {
  const pal = usePalette('default')
  const palError = usePalette('error')
  const [override, setOverride] = React.useState(false)

  if (!isMuted && !labels?.length) {
    return <>{children}</>
  }

  const label = labels?.[0] // TODO use config to settle on most relevant item
  const labelGroup = getLabelValueGroup(label?.val || '')
  if (labelGroup.id === 'illegal') {
    return <></>
  }

  return (
    <View style={[styles.container, pal.view]}>
      <View style={[styles.description, pal.view, pal.border]}>
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
        <View
          style={[styles.childrenContainer, pal.border, palError.viewLight]}>
          {children}
        </View>
      )}
    </View>
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
    paddingVertical: 6,
  },
})
