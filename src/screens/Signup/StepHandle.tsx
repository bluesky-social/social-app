import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {createFullHandle} from '#/lib/strings/handles'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {useSignupContext} from '#/screens/Signup/state'
import {atoms as a} from '#/alf'
import {FormError} from '#/components/forms/FormError'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Text} from '#/components/Typography'

export function StepHandle() {
  const {_} = useLingui()
  const {state, dispatch} = useSignupContext()

  const onHandleChange = React.useCallback(
    (value: string) => {
      if (state.error) {
        dispatch({type: 'setError', value: ''})
      }

      dispatch({
        type: 'setHandle',
        value,
      })
    },
    [dispatch, state.error],
  )

  return (
    <ScreenTransition>
      <View style={[a.gap_lg]}>
        <View>
          <TextField.Root>
            <TextField.Icon icon={At} />
            <TextField.Input
              testID="handleInput"
              onChangeText={onHandleChange}
              label={_(msg`Input your user handle`)}
              defaultValue={state.handle}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              autoComplete="off"
            />
          </TextField.Root>
        </View>
        <Text style={[a.text_md]}>
          <Trans>Your full handle will be</Trans>{' '}
          <Text style={[a.text_md, a.font_bold]}>
            @{createFullHandle(state.handle, state.userDomain)}
          </Text>
        </Text>
        <FormError error={state.error} />
      </View>
    </ScreenTransition>
  )
}
