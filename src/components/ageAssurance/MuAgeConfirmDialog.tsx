import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {usePatchAgeAssuranceOtherRequiredData} from '#/ageAssurance'
import {setBirthdateForDid} from '#/ageAssurance/data'
import {birthdateFromFlags, setMuAgeStatus} from '#/ageAssurance/muAgeService'
import {IS_WEB} from '#/env'

/**
 * mu age confirmation dialog. Writes self-declared age threshold flags to the mu
 * age-assurance backend (works over OAuth + password sessions), then
 * optimistically updates the age-assurance cache so the gate lifts. The user
 * simply confirms they are 18 or older - no birthdate is collected or sent.
 */
export function MuAgeConfirmDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {t: l} = useLingui()
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`Confirm your age`}
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
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  const onConfirm = useCallback(async () => {
    setError('')
    setIsPending(true)
    try {
      const flags = {over13: true, over16: true, over18: true}
      await setMuAgeStatus(agent, flags)
      const birthdate = birthdateFromFlags(flags)
      if (currentAccount?.did) {
        setBirthdateForDid({did: currentAccount.did, birthdate})
      }
      patch({birthdate})
      control.close()
    } catch (e) {
      logger.error('MuAgeConfirmDialog: save failed', {safeMessage: String(e)})
      setError(l`Something went wrong. Please try again.`)
      setIsPending(false)
    }
  }, [agent, currentAccount, patch, control, l])

  return (
    <View style={[a.gap_md]}>
      <Text style={[a.text_xl, a.font_semi_bold]}>
        <Trans>Confirm your age</Trans>
      </Text>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
        <Trans>
          This is a one-time thing. It's private and not shared with other
          users.
        </Trans>
      </Text>

      {error ? <Admonition type="error">{error}</Admonition> : null}

      <View style={IS_WEB && [a.flex_row, a.justify_end]}>
        <Button
          label={l`Confirm that you are 18 or older`}
          size="large"
          onPress={() => void onConfirm()}
          variant="solid"
          color="primary"
          disabled={isPending}>
          <ButtonText>
            <Trans>I am 18 or older</Trans>
          </ButtonText>
          {isPending && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </View>
  )
}
