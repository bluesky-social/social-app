import {View, type ViewStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type Gate} from '#/lib/statsig/gates'
import {useGate} from '#/lib/statsig/statsig'
import {isWeb} from '#/platform/detection'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

interface LoggedOutCTAProps {
  style?: ViewStyle
  gateName: Gate
}

export function LoggedOutCTA({style, gateName}: LoggedOutCTAProps) {
  const {hasSession} = useSession()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const gate = useGate()
  const t = useTheme()
  const {_} = useLingui()

  // Only show for logged-out users on web
  if (hasSession || !isWeb) {
    return null
  }

  // Check gate at the last possible moment to avoid counting users as exposed when they won't see the element
  if (!gate(gateName)) {
    return null
  }

  return (
    <View style={[a.pb_md, style]}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.px_lg,
          a.py_md,
          a.rounded_md,
          a.mb_xs,
          t.atoms.bg_contrast_25,
        ]}>
        <View style={[a.flex_row, a.align_center, a.flex_1, a.pr_md]}>
          <Logo width={30} style={[a.mr_md]} />
          <View style={[a.flex_1]}>
            <Text style={[a.text_lg, a.font_bold, a.leading_snug]}>
              <Trans>Join Bluesky</Trans>
            </Text>
            <Text
              style={[
                a.text_md,
                a.font_medium,
                a.leading_snug,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>The open social network.</Trans>
            </Text>
          </View>
        </View>
        <Button
          onPress={() => {
            requestSwitchToAccount({requestedAccount: 'new'})
          }}
          label={_(msg`Create account`)}
          size="small"
          variant="solid"
          color="primary">
          <ButtonText>
            <Trans>Create account</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
