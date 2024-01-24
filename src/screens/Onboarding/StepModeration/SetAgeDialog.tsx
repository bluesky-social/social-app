import React, {useState} from 'react'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'
import {View} from 'react-native'

import {
  UsePreferencesQueryResponse,
  usePreferencesSetBirthDateMutation,
} from 'state/queries/preferences'
import {atoms as a} from '#/alf'
import {logger} from '#/logger'
import * as Prompt from '#/components/Prompt'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {cleanError} from 'lib/strings/errors'
import {DateInput} from 'view/com/util/forms/DateInput'
import {Loader} from '#/components/Loader'
import {ButtonIcon, ButtonText} from '#/components/Button'

export function SetAgeDialog({
  preferences,
  prompt,
}: {
  preferences?: UsePreferencesQueryResponse
  prompt: any
}) {
  const {_} = useLingui()

  const {
    isPending,
    isError,
    error,
    mutateAsync: setBirthDate,
  } = usePreferencesSetBirthDateMutation()
  const [date, setDate] = useState(
    preferences?.birthDate ? new Date(preferences.birthDate) : new Date(),
  )
  const onSave = React.useCallback(async () => {
    try {
      await setBirthDate({birthDate: date})
      prompt.close()
    } catch (e) {
      logger.error(`setBirthDate failed`, {error: e})
    }
  }, [date, setBirthDate, prompt])

  return (
    <Prompt.Outer control={prompt}>
      <Prompt.Title>
        <Trans>Add your birth date</Trans>
      </Prompt.Title>
      <Prompt.Description>
        <Trans>This information is not shared publicly.</Trans>
      </Prompt.Description>

      {isError ? <ErrorMessage message={cleanError(error)} /> : undefined}

      <View style={[a.pb_xl]}>
        <DateInput
          handleAsUTC
          testID="birthdayInput"
          value={date}
          onChange={setDate}
          buttonLabelType="sm"
          accessibilityLabel={_(msg`Birthday`)}
          accessibilityHint={_(msg`Enter your birth date`)}
          accessibilityLabelledBy="birthDate"
        />
      </View>

      <Prompt.Actions>
        <Prompt.Cancel onPress={prompt.close}>
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Prompt.Cancel>
        <Prompt.Action onPress={onSave}>
          <ButtonText>
            <Trans>Save</Trans>
          </ButtonText>
          {isPending && <ButtonIcon icon={Loader} position="right" />}
        </Prompt.Action>
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
