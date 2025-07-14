import {useMemo} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, select, useTheme} from '#/alf'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {
  AgeAssuranceInitDialog,
  useDialogControl,
} from '#/components/ageAssurance/AgeAssuranceInitDialog'
import {IsAgeRestricted} from '#/components/ageAssurance/IsAgeRestricted'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function AgeRestrictedScreen({
  children,
  fallback,
  screenTitle,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  screenTitle?: string
}) {
  const t = useTheme()
  const {_} = useLingui()
  const control = useDialogControl()
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
                {screenTitle ?? <Trans>Unavailable</Trans>}
              </Layout.Header.TitleText>
            </Layout.Header.Content>
            <Layout.Header.Slot />
          </Layout.Header.Outer>
          <Layout.Content>
            <View style={[a.p_lg]}>
              <View
                style={[
                  a.p_lg,
                  a.rounded_md,
                  a.border,
                  {
                    backgroundColor: select(t.name, {
                      light: t.palette.primary_25,
                      dark: t.palette.primary_25,
                      dim: t.palette.primary_25,
                    }),
                    borderColor: select(t.name, {
                      light: t.palette.primary_100,
                      dark: t.palette.primary_100,
                      dim: t.palette.primary_100,
                    }),
                  },
                ]}>
                <AgeAssuranceInitDialog control={control} />

                <View style={[a.align_start, a.pb_md]}>
                  <AgeAssuranceBadge />
                </View>

                <Text style={[a.text_md, a.leading_snug, a.pb_sm]}>
                  <Trans>
                    The laws in your location require that you verify your age
                    before accessing certain features on Bluesky like adult
                    content and direct messaging.
                  </Trans>
                </Text>

                <Text style={[a.text_md, a.leading_snug]}>
                  <Trans>
                    You must complete age verification to access this screen.
                  </Trans>
                </Text>

                <Divider style={[a.mt_lg]} />

                <View
                  style={[
                    a.flex_row,
                    a.justify_between,
                    a.align_center,
                    a.pt_md,
                    a.gap_lg,
                  ]}>
                  <Text
                    style={[
                      {
                        color: select(t.name, {
                          light: t.palette.primary_800,
                          dark: t.palette.primary_800,
                          dim: t.palette.primary_800,
                        }),
                      },
                    ]}>
                    <Trans>Age verification takes only a few minutes</Trans>
                  </Text>

                  <Button
                    label={_(msg`Verify now`)}
                    size="small"
                    variant="solid"
                    color="primary"
                    onPress={() => control.open()}>
                    <ButtonText>
                      <Trans>Verify now</Trans>
                    </ButtonText>
                  </Button>
                </View>
              </View>
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
