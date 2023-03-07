import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from './text/Text'

export function PostMutedWrapper({
  isMuted,
  children,
}: React.PropsWithChildren<{isMuted: boolean}>) {
  const pal = usePalette('default')
  const [override, setOverride] = React.useState(false)
  if (!isMuted || override) {
    return <>{children}</>
  }
  return (
    <View style={[styles.container, pal.view, pal.border]}>
      <FontAwesomeIcon
        icon={['far', 'eye-slash']}
        style={[styles.icon, pal.text]}
      />
      <Text type="md" style={pal.textLight}>
        Post from an account you muted.
      </Text>
      <TouchableOpacity
        style={styles.showBtn}
        onPress={() => setOverride(true)}>
        <Text type="md" style={pal.link}>
          Show post
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
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
})
