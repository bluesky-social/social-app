import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from 'state/index'
import {s, colors, gradients} from 'lib/styles'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {RepostIcon} from 'lib/icons'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

export const snapPoints = [250]

export function Component({
  onRepost,
  onQuote,
  isReposted,
}: {
  onRepost: () => void
  onQuote: () => void
  isReposted: boolean
}) {
  const store = useStores()
  const pal = usePalette('default')
  const onPress = async () => {
    store.shell.closeModal()
  }

  return (
    <View testID="repostModal" style={[s.flex1, pal.view, styles.container]}>
      <View style={s.pb20}>
        <TouchableOpacity
          testID="repostBtn"
          style={[styles.actionBtn]}
          onPress={onRepost}>
          <RepostIcon strokeWidth={2} size={24} style={s.blue3} />
          <Text type="title-lg" style={[styles.actionBtnLabel, pal.text]}>
            {!isReposted ? 'Repost' : 'Undo repost'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="quoteBtn"
          style={[styles.actionBtn]}
          onPress={onQuote}>
          <FontAwesomeIcon icon="quote-left" size={24} style={s.blue3} />
          <Text type="title-lg" style={[styles.actionBtnLabel, pal.text]}>
            Quote Post
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity testID="cancelBtn" onPress={onPress}>
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
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
