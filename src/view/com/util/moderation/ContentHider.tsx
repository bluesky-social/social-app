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
import {Text} from '../text/Text'
import {getLabelValueGroup} from 'lib/labeling/helpers'
import {addStyle} from 'lib/styles'

export function ContentHider({
  testID,
  isMuted,
  labels,
  style,
  containerStyle,
  children,
}: React.PropsWithChildren<{
  testID?: string
  isMuted?: boolean
  labels: ComAtprotoLabelDefs.Label[] | undefined
  style?: StyleProp<ViewStyle>
  containerStyle?: StyleProp<ViewStyle>
}>) {
  const pal = usePalette('default')
  const [override, setOverride] = React.useState(false)

  if (!isMuted && !labels?.length) {
    return (
      <View testID={testID} style={style}>
        {children}
      </View>
    )
  }

  const label = labels?.[0] // TODO use config to settle on most relevant item
  const labelGroup = getLabelValueGroup(label?.val || '')
  if (labelGroup.id === 'illegal') {
    return <></>
  }

  return (
    <View style={[styles.container, pal.view, pal.border, containerStyle]}>
      <View
        style={[
          styles.description,
          pal.viewLight,
          override && styles.descriptionOpen,
        ]}>
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
            {override ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
      {override && (
        <View style={[styles.childrenContainer, pal.border]}>
          <View testID={testID} style={addStyle(style, styles.child)}>
            {children}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  description: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 18,
    borderRadius: 12,
  },
  descriptionOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  icon: {
    marginRight: 10,
  },
  showBtn: {
    marginLeft: 'auto',
  },
  childrenContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  child: {},
})
