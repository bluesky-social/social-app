import React, {useCallback} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from 'state/index'
import {s, colors, gradients} from 'lib/styles'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {RepostIcon} from 'lib/icons'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {PickableData} from '../../w2/web-reader/DraggableFab'

export const snapPoints = [250]

export function Component({
  onWordDJ,
  onWaverlyChat,
  pickableData,
}: {
  onWordDJ: (pd: PickableData | undefined) => void
  onWaverlyChat: (pd: PickableData | undefined) => void
  pickableData?: PickableData
}) {
  const store = useStores()
  const pal = usePalette('default')
  const onPress = async () => {
    store.shell.closeModal()
  }
  const onPressWordDJBtn = useCallback(() => {
    onWordDJ(pickableData)
  }, [onWordDJ, pickableData])
  const onPressWaverlyChatBtn = useCallback(() => {
    onWaverlyChat(pickableData)
  }, [onWaverlyChat, pickableData])
  return (
    <View testID="waverlyModal" style={[s.flex1, pal.view, styles.container]}>
      <View style={s.pb20}>
        <TouchableOpacity
          testID="wordDJBtn"
          style={[styles.actionBtn]}
          onPress={onPressWordDJBtn}
          accessibilityRole="button"
          accessibilityLabel={'WordDJ'}
          accessibilityHint={'WordDJ'}>
          <RepostIcon strokeWidth={2} size={24} style={s.waverly1} />
          <Text type="title-lg" style={[styles.actionBtnLabel, pal.text]}>
            WordDJ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="waverlyChatBtn"
          style={[styles.actionBtn]}
          onPress={onPressWaverlyChatBtn}
          accessibilityRole="button"
          accessibilityLabel="Ask Waverly"
          accessibilityHint="">
          <FontAwesomeIcon icon="quote-left" size={24} style={s.waverly1} />
          <Text type="title-lg" style={[styles.actionBtnLabel, pal.text]}>
            Ask Waverly...
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        testID="cancelWaverlyBtn"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Cancel Waverly button"
        accessibilityHint=""
        onAccessibilityEscape={onPress}>
        <LinearGradient
          colors={[gradients.waverlyDark.start, gradients.waverlyDark.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.btn]}>
          <Text style={[s.white, s.bold, s.f18]}>Cancel</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    fontSize: 17,
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.gray1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnLabel: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
})
