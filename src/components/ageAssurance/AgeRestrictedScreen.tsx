import {useMemo} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {atoms as a} from '#/alf'
import {IsAgeRestricted} from '#/components/ageAssurance/IsAgeRestricted'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function AgeRestrictedScreen({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const screenFallback = useMemo(() => {
    return (
      fallback || (
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
    )
  }, [fallback])

  return (
    <>
      <IsAgeRestricted.True fallback={screenFallback}>
        <Layout.Screen>
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

      <IsAgeRestricted.False fallback={screenFallback}>
        {children}
      </IsAgeRestricted.False>
    </>
  )
}
