import {useReducer} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {wait} from '#/lib/async/wait'
import {useCleanError} from '#/lib/hooks/useCleanError'
import {logger} from '#/logger'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogContext} from '#/components/Dialog'
import {useManageEmail2FA} from '#/components/dialogs/EmailDialog/data/useManageEmail2FA'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

type State = {
  error: string
  status: 'pending' | 'success' | 'error' | 'default'
}

type Action =
  | {
      type: 'setError'
      error: string
    }
  | {
      type: 'setStatus'
      status: State['status']
    }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setError': {
      return {
        ...state,
        error: action.error,
        status: 'error',
      }
    }
    case 'setStatus': {
      return {
        ...state,
        error: '',
        status: action.status,
      }
    }
    default: {
      return state
    }
  }
}

export function Enable() {
  const t = useTheme()
  const {_} = useLingui()
  const cleanError = useCleanError()
  const {gtPhone} = useBreakpoints()
  const {mutateAsync: manageEmail2FA} = useManageEmail2FA()
  const control = useDialogContext()

  const [state, dispatch] = useReducer(reducer, {
    error: '',
    status: 'default',
  })

  const handleManageEmail2FA = async () => {
    dispatch({type: 'setStatus', status: 'pending'})

    try {
      await wait(1000, manageEmail2FA({enabled: true}))
      dispatch({type: 'setStatus', status: 'success'})
      setTimeout(() => {
        control.close()
      }, 1000)
    } catch (e) {
      logger.error('Manage2FA: enable email 2FA failed', {safeMessage: e})
      const {clean} = cleanError(e)
      dispatch({
        type: 'setError',
        error: clean || _(msg`Failed to update email 2FA settings`),
      })
    }
  }

  return (
    <View style={[a.gap_lg]}>
      <View style={[a.gap_sm]}>
        <Text style={[a.text_xl, a.font_heavy, a.leading_snug]}>
          <Trans>Enable email 2FA</Trans>
        </Text>

        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>Require an email code to sign in to your account.</Trans>
        </Text>
      </View>

      {state.error && <Admonition type="error">{state.error}</Admonition>}

      <View style={[a.gap_sm, gtPhone && [a.flex_row_reverse]]}>
        <Button
          label={_(msg`Enable`)}
          size="large"
          variant="solid"
          color="primary"
          onPress={handleManageEmail2FA}
          disabled={state.status === 'pending'}>
          <ButtonText>
            <Trans>Enable</Trans>
          </ButtonText>
          <ButtonIcon
            position="right"
            icon={
              state.status === 'pending'
                ? Loader
                : state.status === 'success'
                  ? Check
                  : ShieldIcon
            }
          />
        </Button>
        <Button
          label={_(msg`Cancel`)}
          size="large"
          variant="solid"
          color="secondary"
          onPress={() => control.close()}>
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
