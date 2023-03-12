import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {colors} from 'lib/styles'
import {ComposeIcon2} from 'lib/icons'
import {DesktopSearch} from './Search'

export const DesktopRightNav = observer(function DesktopRightNav() {
  const store = useStores()
  const pal = usePalette('default')
  const onPressCompose = () => store.shell.openComposer({})

  return (
    <View style={[styles.rightNav, pal.view]}>
      <TouchableOpacity style={[styles.newPostBtn]} onPress={onPressCompose}>
        <View style={styles.newPostBtnIconWrapper}>
          <ComposeIcon2
            size={19}
            strokeWidth={2}
            style={styles.newPostBtnLabel}
          />
        </View>
        <Text type="button" style={styles.newPostBtnLabel}>
          New Post
        </Text>
      </TouchableOpacity>
      <DesktopSearch />
    </View>
  )
})

const styles = StyleSheet.create({
  rightNav: {
    position: 'absolute',
    top: 10,
    left: 'calc(50vw + 330px)',
    width: 300,
  },

  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 134,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.blue3,
    marginTop: 10,
    marginBottom: 12,
  },
  newPostBtnIconWrapper: {
    marginRight: 8,
  },
  newPostBtnLabel: {
    color: colors.white,
    fontSize: 16,
  },
})
