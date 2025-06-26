import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {atoms as a} from '#/alf'
import {IsAgeRestricted} from '#/components/ageAssurance/IsAgeRestricted'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function AgeRestrictedScreen({children}: {children: React.ReactNode}) {
  return (
    <>
      <IsAgeRestricted.True>
        <Layout.Screen testID="messagesSettingsScreen">
          <Layout.Header.Outer>
            <Layout.Header.BackButton />
            <Layout.Header.Content>
              <Layout.Header.TitleText>
                <Trans>Not allowed</Trans>
              </Layout.Header.TitleText>
            </Layout.Header.Content>
            <Layout.Header.Slot />
          </Layout.Header.Outer>
          <Layout.Content>
            <View style={[a.p_lg, a.gap_md]}>
              <Text style={[a.text_lg, a.font_bold]}>
                <Trans>We're sorry, but this content is unavailable.</Trans>
              </Text>
            </View>
          </Layout.Content>
        </Layout.Screen>
      </IsAgeRestricted.True>

      <IsAgeRestricted.False>{children}</IsAgeRestricted.False>
    </>
  )
}
