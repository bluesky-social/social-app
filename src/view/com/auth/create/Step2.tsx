import React from 'react'
import {View} from 'react-native'
import {CreateAccountState, CreateAccountDispatch} from './state'
import {Text} from 'view/com/util/text/Text'
import {StepHeader} from './StepHeader'
import {s} from 'lib/styles'
import {TextInput} from '../util/TextInput'
import {
  createFullHandle,
  IsValidHandle,
  validateHandle,
} from 'lib/strings/handles'
import {usePalette} from 'lib/hooks/usePalette'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {atoms as a, useTheme} from '#/alf'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '#/components/icons/Times'
import {useFocusEffect} from '@react-navigation/native'

/** STEP 3: Your user handle
 * @field User handle
 */
export function Step2({
  uiState,
  uiDispatch,
}: {
  uiState: CreateAccountState
  uiDispatch: CreateAccountDispatch
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const t = useTheme()

  const [validCheck, setValidCheck] = React.useState<IsValidHandle>({
    handleChars: false,
    frontLength: false,
    totalLength: true,
    overall: false,
  })

  useFocusEffect(
    React.useCallback(() => {
      setValidCheck(validateHandle(uiState.handle, uiState.userDomain))

      // Disabling this, because we only want to run this when we focus the screen
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  )

  const onHandleChange = React.useCallback(
    (value: string) => {
      if (uiState.error) {
        uiDispatch({type: 'set-error', value: ''})
      }

      setValidCheck(validateHandle(value, uiState.userDomain))
      uiDispatch({type: 'set-handle', value})
    },
    [uiDispatch, uiState.error, uiState.userDomain],
  )

  return (
    <View>
      <StepHeader uiState={uiState} title={_(msg`Your user handle`)} />
      <View style={s.pb10}>
        <View style={s.mb20}>
          <TextInput
            testID="handleInput"
            icon="at"
            placeholder="e.g. alice"
            value={uiState.handle}
            editable
            autoFocus
            autoComplete="off"
            autoCorrect={false}
            onChange={onHandleChange}
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
        <View
          style={[
            a.w_full,
            a.rounded_sm,
            a.border,
            a.p_md,
            a.gap_sm,
            t.atoms.border_contrast_low,
          ]}>
          {uiState.error ? (
            <View style={[a.w_full, a.flex_row, a.align_center, a.gap_sm]}>
              <IsValidIcon valid={false} />
              <Text style={[t.atoms.text, a.text_md, a.flex]}>
                {uiState.error}
              </Text>
            </View>
          ) : undefined}
          <View style={[a.w_full, a.flex_row, a.align_center, a.gap_sm]}>
            <IsValidIcon valid={validCheck.handleChars} />
            <Text style={[t.atoms.text, a.text_md, a.flex]}>
              <Trans>May only contain letters and numbers</Trans>
            </Text>
          </View>
          <View style={[a.w_full, a.flex_row, a.align_center, a.gap_sm]}>
            <IsValidIcon
              valid={validCheck.frontLength && validCheck.totalLength}
            />
            {!validCheck.totalLength ? (
              <Text style={[t.atoms.text]}>
                <Trans>May not be longer than 253 characters</Trans>
              </Text>
            ) : (
              <Text style={[t.atoms.text, a.text_md]}>
                <Trans>Must be at least 3 characters</Trans>
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

function IsValidIcon({valid}: {valid: boolean}) {
  const t = useTheme()

  if (!valid) {
    return <Times size="md" style={{color: t.palette.negative_500}} />
  }

  return <Check size="md" style={{color: t.palette.positive_700}} />
}
