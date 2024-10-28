import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {
  useMainSubscriptions,
  usePurchaseSubscription,
} from '#/state/purchases/subscriptions'
// import {useEntitlements} from '#/state/purchases/subscriptions/useEntitlements'
import {Subscriptions as SubscriptionsResponse} from '#/state/purchases/subscriptions/types'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export type ScreenProps = NativeStackScreenProps<
  CommonNavigatorParams,
  'Subscriptions'
>

export function Subscriptions(_props: ScreenProps) {
  const {_} = useLingui()

  // const {data: entitlements} = useEntitlements()
  const {data: subscriptions, isError} = useMainSubscriptions()

  return (
    <Layout.Screen>
      <CenteredView sideBorders={true}>
        <ViewHeader title={_(msg`Subscriptions`)} />
        <View style={[a.px_xl, a.py_xl, a.gap_lg]}>
          <Text style={[a.text_2xl]}>Subs</Text>

          {isError ? (
            <Text>Error</Text>
          ) : !subscriptions ? (
            <Loader />
          ) : (
            <MainSubscription subscriptions={subscriptions} />
          )}
        </View>
      </CenteredView>
    </Layout.Screen>
  )
}

export function MainSubscription({
  subscriptions,
}: {
  subscriptions: SubscriptionsResponse
}) {
  const t = useTheme()

  const active = subscriptions.active.at(0)
  const {mutateAsync: purchaseSubscription} = usePurchaseSubscription()

  if (active) {
    const contents = (
      <View style={[a.gap_sm]}>
        <View style={[a.flex_row, a.align_center, a.justify_between]}>
          <Text style={[a.text_xl, a.font_heavy]}>Bluesky Plus</Text>
          <Text
            style={[
              a.text_md,
              a.font_bold,
              a.p_xs,
              a.rounded_xs,
              {
                color: t.palette.white,
                backgroundColor: t.palette.primary_500,
              },
            ]}>
            Supporter
          </Text>
        </View>

        <Text style={[a.text_md]}>Managed via: {active?.platform}</Text>
      </View>
    )

    return (
      <View
        style={[a.p_lg, a.rounded_md, a.border, t.atoms.border_contrast_low]}>
        {contents}
      </View>
    )
  } else {
    return (
      <View
        style={[a.p_lg, a.rounded_md, a.border, t.atoms.border_contrast_low]}>
        <View style={[a.gap_sm, a.pb_xl]}>
          {subscriptions.available.monthly.map(s => (
            <View key={s.id}>
              <Button
                label={s.id}
                size="small"
                variant="solid"
                color={s.status === 'active' ? 'primary' : 'secondary'}
                onPress={() => {
                  purchaseSubscription(s.product)
                }}>
                <ButtonText>
                  {s.id} ({s.price.formatted})
                </ButtonText>
              </Button>
            </View>
          ))}
        </View>
        <View style={[a.gap_sm]}>
          {subscriptions.available.annual.map(s => (
            <View key={s.id}>
              <Button
                label={s.id}
                size="small"
                variant="solid"
                color={s.status === 'active' ? 'primary' : 'secondary'}
                onPress={() => {
                  purchaseSubscription(s.product)
                }}>
                <ButtonText>
                  {s.id} ({s.price.formatted})
                </ButtonText>
              </Button>
            </View>
          ))}
        </View>
      </View>
    )
  }
}
