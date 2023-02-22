import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {CenteredView} from './Views'
import {Text} from './text/Text'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {colors} from 'lib/styles'

const BACK_HITSLOP = {left: 10, top: 10, right: 30, bottom: 10}

export const ViewHeader = observer(function ViewHeader({
  title,
  subtitle,
  canGoBack,
}: {
  title: string
  subtitle?: string
  canGoBack?: boolean
}) {
  const pal = usePalette('default')
  const store = useStores()
  const onPressBack = () => {
    store.nav.tab.goBack()
  }
  if (typeof canGoBack === 'undefined') {
    canGoBack = store.nav.tab.canGoBack
  }
  return (
    <CenteredView style={[styles.header, pal.view]}>
      {canGoBack ? (
        <>
          <TouchableOpacity
            testID="viewHeaderBackOrMenuBtn"
            onPress={onPressBack}
            hitSlop={BACK_HITSLOP}
            style={styles.backBtn}>
            <FontAwesomeIcon
              size={18}
              icon="angle-left"
              style={[styles.backIcon, pal.text]}
            />
          </TouchableOpacity>
          <View style={styles.titleContainer} pointerEvents="none">
            <Text type="title" style={[pal.text, styles.title]}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                type="title-sm"
                style={[styles.subtitle, pal.textLight]}
                numberOfLines={1}>
                {subtitle}
              </Text>
            ) : undefined}
          </View>
        </>
      ) : (
        <View style={styles.titleContainer} pointerEvents="none">
          <Text type="title" style={[pal.text, styles.title]}>
            Home
          </Text>
        </View>
      )}
    </CenteredView>
  )
})

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 'auto',
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginLeft: 4,
    maxWidth: 200,
    fontWeight: 'normal',
  },

  backBtn: {
    width: 30,
  },
  backIcon: {
    position: 'relative',
    top: -1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 20,
    marginLeft: 4,
  },
  littleXIcon: {
    color: colors.red3,
    position: 'absolute',
    right: 7,
    bottom: 7,
  },
})
