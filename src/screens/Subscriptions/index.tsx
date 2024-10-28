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
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export type ScreenProps = NativeStackScreenProps<
  CommonNavigatorParams,
  'Subscriptions'
>

export function Subscriptions(_props: ScreenProps) {
  const {_} = useLingui()

  const {data: subscriptions} = useMainSubscriptions()
  const {mutateAsync: purchaseSubscription} = usePurchaseSubscription()

  return (
    <Layout.Screen>
      <CenteredView sideBorders={true}>
        <ViewHeader title={_(msg`Liked By`)} />
        <View style={[a.px_xl, a.py_xl, a.gap_lg]}>
          <Text style={[a.text_2xl]}>Subs</Text>

          <View style={[a.gap_sm]}>
            {subscriptions?.monthly.map(s => (
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
            {subscriptions?.annual.map(s => (
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
      </CenteredView>
    </Layout.Screen>
  )
}
