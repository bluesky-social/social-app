import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {Trans} from '@lingui/macro'
import {CreateAccountState} from './state'

export function StepHeader({
  uiState,
  title,
  children,
}: React.PropsWithChildren<{uiState: CreateAccountState; title: string}>) {
  const pal = usePalette('default')
  const numSteps = 3
  return (
    <View style={styles.container}>
      <View>
        <Text type="lg" style={[pal.textLight]}>
          {uiState.step === 3 ? (
            <Trans>Last step!</Trans>
          ) : (
            <Trans>
              Step {uiState.step} of {numSteps}
            </Trans>
          )}
        </Text>

        <Text style={[pal.text]} type="title-xl">
          {title}
        </Text>
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
})
