import React from 'react'
import {View, Linking} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

// import {isAndroid, isIOS} from '#/platform/detection'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {Text} from '#/components/Typography'
// import {Divider} from '#/components/Divider'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Logotype} from '#/components/icons/BlueskyPlus'
import {useEntitlements} from '#/state/purchases/subscriptions/useEntitlements'
import {useCreateCheckout} from '#/state/purchases/subscriptions/useCreateCheckout'
import {useSession} from '#/state/session'

export type ScreenProps = NativeStackScreenProps<
  CommonNavigatorParams,
  'Subscriptions'
>

export function Subscriptions(_props: ScreenProps) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {data: entitlements, isLoading: isEntitlementsLoading} = useEntitlements()
  const isSubscribed = entitlements?.some(e => e.id === 'core')

  const {mutateAsync: createCheckout} = useCreateCheckout()
  const isPending = false

  const onPressMonthly = async () => {
    try {
      const data = await createCheckout({
        did: currentAccount!.did,
        email: currentAccount!.email!,
        price: 'price_1QLsNLAwTlpRxHkAhuUwbnlL',
      })

      if (!data?.checkoutUrl) {
        throw new Error('No checkout URL')
      }

      Linking.openURL(data.checkoutUrl)
    } catch (e: any) {
    }
  }
  const onPressAnnual = async () => {
    try {
      const data = await createCheckout({
        did: currentAccount!.did,
        email: currentAccount!.email!,
        price: 'price_1QLsOjAwTlpRxHkAcrV8DL2P',
      })

      if (!data?.checkoutUrl) {
        throw new Error('No checkout URL')
      }

      Linking.openURL(data.checkoutUrl)
    } catch (e: any) {
    }
  }


  return (
    <Layout.Screen>
      <CenteredView sideBorders={true} style={[a.util_screen_outer]}>
        <View style={[a.px_xl, a.py_xl, a.gap_lg]}>
          <Logotype width={200} fill='nordic' />

          <View style={[a.pt_xl]}>
            {isEntitlementsLoading ? (
              <Loader />
            ) : (
              <>
                {isSubscribed ? (
                  <View>
                    <Text>You're subscribed!</Text>
                  </View>
                ) : (
                  <View style={[a.flex_row, a.gap_md]}>
                    <Button
                      label={_('Subscribe')}
                      onPress={onPressMonthly}
                      size='large'
                      variant='solid'
                      color='primary'
                    >
                      <ButtonText>Subscribe ($6/month)</ButtonText>
                      <ButtonIcon icon={isPending ? Loader : Plus} />
                    </Button>
                    <Button
                      label={_('Subscribe')}
                      onPress={onPressAnnual}
                      size='large'
                      variant='solid'
                      color='secondary'
                    >
                      <ButtonText>Subscribe ($60/year)</ButtonText>
                      <ButtonIcon icon={isPending ? Loader : Plus} />
                    </Button>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </CenteredView>
    </Layout.Screen>
  )
}
