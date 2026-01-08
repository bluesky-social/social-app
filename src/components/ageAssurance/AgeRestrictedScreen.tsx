import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {AgeAssuranceConfigUnavailableError} from '#/components/ageAssurance/AgeAssuranceErrors'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {logger} from '#/ageAssurance'

export function AgeRestrictedScreen({
  children,
  screenTitle,
  infoText,
  rightHeaderSlot,
}: {
  children: React.ReactNode
  screenTitle?: string
  infoText?: string
  rightHeaderSlot?: React.ReactNode
}) {
  const {_} = useLingui()
  const copy = useAgeAssuranceCopy()
  const aa = useAgeAssurance()

  if (aa.state.access === aa.Access.Full) return children

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            {screenTitle ?? <Trans>Unavailable</Trans>}
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        {rightHeaderSlot ?? <Layout.Header.Slot />}
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[a.p_lg]}>
          {aa.state.error === 'config' && (
            <View style={[a.pb_lg]}>
              <AgeAssuranceConfigUnavailableError />
            </View>
          )}

          <View style={[a.align_start, a.pb_lg]}>
            <AgeAssuranceBadge />
          </View>

          <View style={[a.gap_sm, a.pb_lg]}>
            <Text style={[a.text_xl, a.leading_snug, a.font_bold]}>
              <Trans>
                You must complete age assurance in order to access this screen.
              </Trans>
            </Text>

            <Text style={[a.text_md, a.leading_snug]}>{copy.notice}</Text>
          </View>

          <View
            style={[a.flex_row, a.justify_between, a.align_center, a.pb_xl]}>
            <Link
              label={_(msg`Go to account settings`)}
              to="/settings/account"
              size="small"
              variant="solid"
              color="primary"
              onPress={() => {
                logger.metric('ageAssurance:navigateToSettings', {})
              }}>
              <ButtonText>
                <Trans>Go to account settings</Trans>
              </ButtonText>
              <ButtonIcon icon={ChevronRight} position="right" />
            </Link>
          </View>

          {infoText && <Admonition type="tip">{infoText}</Admonition>}
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
