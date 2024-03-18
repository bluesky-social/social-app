/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React from 'react'
import {SafeAreaView, Text, TouchableOpacity, StyleSheet} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {createHitslop} from '#/lib/constants'

type Props = {
  onRequestClose: () => void
}

const HIT_SLOP = createHitslop(16)

const ImageDefaultHeader = ({onRequestClose}: Props) => {
  const {_} = useLingui()
  return (
    <SafeAreaView style={styles.root}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onRequestClose}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Close image`)}
        accessibilityHint={_(msg`Closes viewer for header image`)}
        onAccessibilityEscape={onRequestClose}>
        <Text style={styles.closeText}>✕</Text>
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
    marginRight: 8,
    marginTop: 8,
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
})

export default ImageDefaultHeader
