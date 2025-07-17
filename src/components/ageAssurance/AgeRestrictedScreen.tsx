import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgeAssurance} from '#/state/ageAssurance/useAgeAssurance'
import {logger} from '#/state/ageAssurance/util'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function AgeRestrictedScreen({
  children,
  screenTitle,
  infoText,
}: {
  children: React.ReactNode
  screenTitle?: string
  infoText?: string
}) {
  const {_} = useLingui()
  const copy = useAgeAssuranceCopy()
  const {isReady, isAgeRestricted} = useAgeAssurance()

  if (!isReady) {
    return (
      <Layout.Screen>
        <Layout.Header.Outer>
          <Layout.Header.Content>
            <Layout.Header.TitleText> </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <Layout.Content />
      </Layout.Screen>
    )
  }
  if (!isAgeRestricted) return children

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            {screenTitle ?? <Trans>Unavailable</Trans>}
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[a.p_lg]}>
          <View style={[a.align_start, a.pb_lg]}>
            <AgeAssuranceBadge />
          </View>

          <View style={[a.gap_sm, a.pb_lg]}>
            <Text style={[a.text_xl, a.leading_snug, a.font_heavy]}>
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
