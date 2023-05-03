import React from 'react'
import {StyleSheet, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import {MagnifyingGlassIcon} from 'lib/icons'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'

export function WhatsHotEmptyState() {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const store = useStores()

  const onPressSettings = React.useCallback(() => {
    store.shell.openModal({name: 'content-languages-settings'})
  }, [store])

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MagnifyingGlassIcon style={[styles.emptyIcon, pal.text]} size={62} />
      </View>
      <Text type="xl-medium" style={[s.textCenter, pal.text]}>
        Your What's Hot feed is empty! This is because there aren't enough users
        posting in your selected language.
      </Text>
      <Button type="inverted" style={styles.emptyBtn} onPress={onPressSettings}>
        <Text type="lg-medium" style={palInverted.text}>
          Update my settings
        </Text>
        <FontAwesomeIcon
          icon="angle-right"
          style={palInverted.text as FontAwesomeIconStyle}
          size={14}
        />
      </Button>
    </View>
  )
}
const styles = StyleSheet.create({
  emptyContainer: {
    height: '100%',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  emptyBtn: {
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 30,
  },

  feedsTip: {
    position: 'absolute',
    left: 22,
  },
  feedsTipArrow: {
    marginLeft: 32,
    marginTop: 8,
  },
})
