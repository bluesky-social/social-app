import React from 'react'
import {StyleSheet, View} from 'react-native'
import {CreateAccountState, CreateAccountDispatch} from './state'
import {Text} from 'view/com/util/text/Text'
import {StepHeader} from './StepHeader'
import {s} from 'lib/styles'
import {TextInput} from '../util/TextInput'
import {createFullHandle} from 'lib/strings/handles'
import {usePalette} from 'lib/hooks/usePalette'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

/** STEP 3: Your user handle
 * @field User handle
 */
export function Step3({
  uiState,
  uiDispatch,
}: {
  uiState: CreateAccountState
  uiDispatch: CreateAccountDispatch
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  return (
    <View>
      <StepHeader uiState={uiState} title={_(msg`Your user handle`)} />
      <View style={s.pb10}>
        <TextInput
          testID="handleInput"
          icon="at"
          placeholder="e.g. alice"
          value={uiState.handle}
          editable
          autoFocus
          autoComplete="off"
          autoCorrect={false}
          onChange={value => uiDispatch({type: 'set-handle', value})}
          // TODO: Add explicit text label
          accessibilityLabel={_(msg`User handle`)}
          accessibilityHint={_(msg`Input your user handle`)}
        />
        <Text type="lg" style={[pal.text, s.pl5, s.pt10]}>
          <Trans>Your full handle will be</Trans>{' '}
          <Text type="lg-bold" style={pal.text}>
            @{createFullHandle(uiState.handle, uiState.userDomain)}
          </Text>
        </Text>
      </View>
      {uiState.error ? (
        <ErrorMessage message={uiState.error} style={styles.error} />
      ) : undefined}
    </View>
  )
}

const styles = StyleSheet.create({
  error: {
    borderRadius: 6,
  },
})
