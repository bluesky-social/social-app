import React from 'react'
import {StyleSheet, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'

export function MyListsEmptyState() {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')

  const onPressCreateList = React.useCallback(() => {
    // TODO
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <FontAwesomeIcon
          icon="list-ul"
          style={[styles.icon, pal.text]}
          size={62}
        />
      </View>
      <Text type="xl-medium" style={[s.textCenter, pal.text]}>
        Lists are public collections of users. You can create a list or find
        other users' lists on their profiles.
      </Text>
      <View style={styles.btns}>
        <Button type="inverted" style={styles.btn} onPress={onPressCreateList}>
          <FontAwesomeIcon
            icon="plus"
            style={palInverted.text as FontAwesomeIconStyle}
            size={14}
          />
          <Text type="lg-medium" style={palInverted.text}>
            New blocklist
          </Text>
        </Button>
      </View>
      <View style={[pal.viewLight, styles.notice]}>
        <Text type="lg" style={[pal.textLight, s.textCenter]}>
          Currently only "blocklists" are available, which is kind of weird but
          we wanted to prioritize user safety. Feedlists will be implemented
          soon!
        </Text>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btn: {
    gap: 10,
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  notice: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 30,
  },
})
