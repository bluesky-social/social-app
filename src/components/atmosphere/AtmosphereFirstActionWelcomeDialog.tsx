import {useEffect, useRef} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {useSession} from '#/state/session'
import {atoms as a, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

/** Lets the pressed button's state change register before the dialog opens. */
const OPEN_DELAY_MS = 500

/**
 * Accounts that have been shown the dialog this session, so it opens once
 * even when several cards create records before the NUX save lands.
 */
const shownTo = new Set<string>()

/**
 * Welcomes the viewer the first time they create a record for Atmosphere
 * content (a recommend, a favorite, etc.). Call `onCreate` when the viewer
 * creates one, and render `AtmosphereFirstActionWelcomeDialog` with `control`.
 *
 * Each caller renders its own dialog, rather than one global dialog, so it
 * can open on top of a dialog the action lives in, like the photo dialog.
 */
export function useAtmosphereFirstActionWelcome() {
  const {currentAccount} = useSession()
  const {nux, status} = useNux(Nux.AtmosphereFirstActionWelcomeDialog)
  const {mutate: saveNux} = useSaveNux()
  const control = Dialog.useDialogControl()
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeout.current), [])

  const onCreate = () => {
    const did = currentAccount?.did
    if (
      !did ||
      status !== 'ready' ||
      nux?.completed ||
      shownTo.has(did) ||
      timeout.current
    ) {
      return
    }
    timeout.current = setTimeout(() => {
      timeout.current = undefined
      if (shownTo.has(did)) return
      shownTo.add(did)
      // Seen once shown, so closing the app with it open doesn't repeat it.
      saveNux({
        id: Nux.AtmosphereFirstActionWelcomeDialog,
        completed: true,
        data: undefined,
      })
      control.open()
    }, OPEN_DELAY_MS)
  }

  return {control, onCreate}
}

export function AtmosphereFirstActionWelcomeDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {t: l} = useLingui()

  return (
    <Dialog.Outer control={control} testID="atmosphereFirstActionWelcomeDialog">
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`Welcome to the Atmosphere!`}
        style={[web({maxWidth: 440})]}>
        <View style={[a.gap_2xl]}>
          <View style={[a.gap_sm]}>
            <Text role="heading" style={[a.text_2xl, a.font_bold]}>
              <Trans>Welcome to the Atmosphere!</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                You just interacted with content produced outside the Bluesky
                app, all from within Bluesky. Pretty neat, huh? The Atmosphere
                is just getting started, keep exploring to learn more!
              </Trans>
            </Text>
          </View>
          <Button
            label={l`Got it`}
            color="primary"
            size="large"
            testID="atmosphereFirstActionWelcomeDialogOkay"
            onPress={() => control.close()}>
            <ButtonText>
              <Trans>Got it</Trans>
            </ButtonText>
          </Button>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
