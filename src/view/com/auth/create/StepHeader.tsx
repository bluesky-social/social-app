import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'

export function StepHeader({step, title}: {step: string; title: string}) {
  const pal = usePalette('default')
  return (
    <View style={styles.container}>
      <Text type="lg" style={pal.textLight}>
        {step === '3' ? 'Last step!' : <>Step {step} of 3</>}
      </Text>
      <Text type="title-xl">{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
})
