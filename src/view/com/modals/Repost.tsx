import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {s, colors, gradients} from 'lib/styles'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {RepostIcon} from 'lib/icons'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'

export const snapPoints = [250]

export function Component({
  onRepost,
  onQuote,
  isReposted,
}: {
  onRepost: () => void
  onQuote: () => void
  isReposted: boolean
  // TODO: Add author into component
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {closeModal} = useModalControls()
  const onPress = async () => {
    closeModal()
  }

  return (
    <View testID="repostModal" style={[s.flex1, pal.view, styles.container]}>
      <View style={s.pb20}>
        <TouchableOpacity
          testID="repostBtn"
          style={[styles.actionBtn]}
          onPress={onRepost}
          accessibilityRole="button"
          accessibilityLabel={
            isReposted
              ? _(msg`Undo repost`)
              : _(msg({message: `Repost`, context: 'action'}))
          }
          accessibilityHint={
            isReposted
              ? _(msg`Remove repost`)
              : _(msg({message: `Repost`, context: 'action'}))
          }>
          <RepostIcon strokeWidth={2} size={24} style={s.blue3} />
          <Text type="title-lg" style={[styles.actionBtnLabel, pal.text]}>
            {!isReposted ? (
              <Trans context="action">Repost</Trans>
            ) : (
              <Trans>Undo repost</Trans>
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="quoteBtn"
          style={[styles.actionBtn]}
          onPress={onQuote}
          accessibilityRole="button"
          accessibilityLabel={_(
            msg({message: `Quote post`, context: 'action'}),
          )}
          accessibilityHint="">
          <FontAwesomeIcon icon="quote-left" size={24} style={s.blue3} />
          <Text type="title-lg" style={[styles.actionBtnLabel, pal.text]}>
            <Trans context="action">Quote Post</Trans>
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        testID="cancelBtn"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Cancel quote post`)}
        accessibilityHint=""
        onAccessibilityEscape={onPress}>
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.btn]}>
          <Text style={[s.white, s.bold, s.f18]}>
            <Trans>Cancel</Trans>
          </Text>
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
