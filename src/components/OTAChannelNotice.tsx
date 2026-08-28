import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useApplyPullRequestOTAUpdate} from '#/lib/hooks/useOTAUpdates'
import {atoms as a, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

/**
 * Warns that the running bundle came from a channel this build doesn't normally
 * receive updates from, e.g. a pull request deployment applied from the dev
 * settings. Renders nothing on a standard channel, and never on web.
 */
export function OTAChannelNotice({style}: {style?: StyleProp<ViewStyle>}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {
    currentChannel,
    defaultChannel,
    isCurrentlyRunningNonStandardChannel,
    restoreDefaultChannel,
    pending,
  } = useApplyPullRequestOTAUpdate()

  if (!isCurrentlyRunningNonStandardChannel) return null

  return (
    <Admonition.Outer
      type="warning"
      style={[t.atoms.bg_contrast_25, a.gap_sm, style]}>
      <Admonition.Row>
        <Admonition.Icon />
        <Admonition.Content style={[a.gap_2xs]}>
          <Text style={[a.text_sm, a.font_bold, a.leading_snug]}>
            <Trans>Non-standard OTA channel</Trans>
          </Text>
          <Admonition.Text>
            <Trans>
              This app is running a deployment of{' '}
              <Text style={[a.text_sm, a.font_bold, a.leading_snug]}>
                {currentChannel}
              </Text>
              . Restore the {defaultChannel} deployment to get back to a
              standard build.
            </Trans>
          </Admonition.Text>
        </Admonition.Content>
      </Admonition.Row>
      <View style={[a.flex_row]}>
        <Admonition.Button
          color="secondary_inverted"
          label={l`Restore the ${defaultChannel} deployment`}
          disabled={pending}
          onPress={() => void restoreDefaultChannel()}>
          <ButtonText>
            <Trans>Restore default</Trans>
          </ButtonText>
          {pending && <ButtonIcon icon={Loader} />}
        </Admonition.Button>
      </View>
    </Admonition.Outer>
  )
}
