import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {getAge, getDateAgo} from '#/lib/strings/time'
import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {DateField} from '#/components/forms/DateField'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {usePatchAgeAssuranceOtherRequiredData} from '#/ageAssurance'
import {setBirthdateForDid} from '#/ageAssurance/data'
import {
  birthdateFromFlags,
  flagsFromBirthdate,
  setMuAgeStatus,
} from '#/ageAssurance/muAgeService'
import {IS_IOS, IS_WEB} from '#/env'

/**
 * mu birthdate declaration dialog. Writes self-declared age threshold flags to
 * the mu age-assurance backend (works over OAuth + password sessions), then
 * optimistically updates the age-assurance cache so the gate lifts. The exact
 * birthdate is only used locally to derive the flags - it is never sent.
 */
export function MuBirthdateDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {t: l} = useLingui()
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`My birthdate`}
        style={web({maxWidth: 400})}>
        <Inner control={control} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner({control}: {control: Dialog.DialogControlProps}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const agent = useAgent()
  const {currentAccount} = useSession()
  const patch = usePatchAgeAssuranceOtherRequiredData()
  const [date, setDate] = useState(getDateAgo(18))
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  const age = getAge(new Date(date))
  const isUnder13 = age < 13
  const isUnder18 = age >= 13 && age < 18

  const onSave = useCallback(async () => {
    if (isUnder13) return
    setError('')
    setIsPending(true)
    try {
      const flags = flagsFromBirthdate(new Date(date))
      await setMuAgeStatus(agent, flags)
      const birthdate = birthdateFromFlags(flags)
      if (currentAccount?.did) {
        setBirthdateForDid({did: currentAccount.did, birthdate})
      }
      patch({birthdate})
      control.close()
    } catch (e) {
      logger.error('MuBirthdateDialog: save failed', {message: String(e)})
      setError(l`Something went wrong saving your birthdate. Please try again.`)
      setIsPending(false)
    }
  }, [agent, date, isUnder13, currentAccount, patch, control, l])

  return (
    <View style={[a.gap_md]}>
      <Text style={[a.text_xl, a.font_semi_bold]}>
        <Trans>My birthdate</Trans>
      </Text>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
        <Trans>
          This is a one-time thing. It's private and not shared with other
          users.
        </Trans>
      </Text>

      <View style={IS_IOS && [a.w_full, a.align_center]}>
        <DateField
          testID="birthdayInput"
          value={date}
          onChangeDate={newDate => setDate(new Date(newDate))}
          label={l`Birthdate`}
          accessibilityHint={l`Enter your birthdate`}
        />
      </View>

      {isUnder18 && (
        <Admonition type="info">
          <Trans>
            This means you are under 18. Certain content and features may be
            unavailable to you.
          </Trans>
        </Admonition>
      )}
      {isUnder13 && (
        <Admonition type="error">
          <Trans>You must be at least 13 years old to use mu.</Trans>
        </Admonition>
      )}
      {error ? <Admonition type="error">{error}</Admonition> : null}

      <View style={IS_WEB && [a.flex_row, a.justify_end]}>
        <Button
          label={l`Save birthdate`}
          size="large"
          onPress={() => void onSave()}
          variant="solid"
          color="primary"
          disabled={isUnder13 || isPending}>
          <ButtonText>
            <Trans>Save</Trans>
          </ButtonText>
          {isPending && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </View>
  )
}
