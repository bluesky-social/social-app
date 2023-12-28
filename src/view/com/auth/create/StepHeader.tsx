import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'

export function StepHeader({step, title}: {step: string; title: string}) {
  const pal = usePalette('default')
  const {_} = useLingui()

  return (
    <View style={styles.container}>
      <Text type="lg" style={[pal.textLight]}>
        {step === '3' ? _(msg`Last step!`) : <Trans>Step {step} of 3</Trans>}
      </Text>
      <Text style={[pal.text]} type="title-xl">
        {title}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
})
