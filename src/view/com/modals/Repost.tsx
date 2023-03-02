import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from 'state/index'
import {s, colors, gradients} from 'lib/styles'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {RepostIcon} from 'lib/icons'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

export const snapPoints = ['30%']

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
    <View style={[s.flex1, s.pl10, s.pr10, pal.view, styles.container]}>
      <View>
        <TouchableOpacity style={[styles.actionBtn]} onPress={onRepost}>
          <RepostIcon strokeWidth={2} size={24} />
          <Text style={[s.f18, s.bold, s.mt10, s.mb10, s.ml10]}>
            {!isReposted ? 'Repost' : 'Undo repost'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn]} onPress={onQuote}>
          <FontAwesomeIcon icon="quote-left" size={24} style={s.blue3} />
          <Text style={[s.f18, s.bold, s.mt10, s.mb10, s.ml10]}>Quote</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onPress}>
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
    justifyContent: 'space-around',
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
})
