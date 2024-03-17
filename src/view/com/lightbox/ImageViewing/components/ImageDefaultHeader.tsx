/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React from 'react'
import {createHitslop} from 'lib/constants'
import {
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import {t} from '@lingui/macro'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from '#/lib/hooks/usePalette'

type Props = {
  onRequestClose: () => void
}

const HIT_SLOP = createHitslop(16)

const ImageDefaultHeader = ({onRequestClose}: Props) => {
  const pal = usePalette('default')

  return (
    <SafeAreaView style={styles.root}>
      <TouchableOpacity
        style={[styles.closeButton, styles.blurredBackground]}
        onPress={onRequestClose}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={t`Close image`}
        accessibilityHint={t`Closes viewer for header image`}
        onAccessibilityEscape={onRequestClose}>
        <FontAwesomeIcon icon="close" color={pal.colors.text} size={22} />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'flex-end',
    pointerEvents: 'box-none',
  },
  closeButton: {
    marginRight: 10,
    marginTop: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#00000077',
  },
  closeText: {
    lineHeight: 22,
    fontSize: 19,
    textAlign: 'center',
    color: '#FFF',
    includeFontPadding: false,
  },
  blurredBackground: {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  } as ViewStyle,
})

export default ImageDefaultHeader
