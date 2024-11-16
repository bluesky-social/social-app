import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

// import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
// import {isAndroid, isIOS} from '#/platform/detection'
import {CommonNavigatorParams} from '#/lib/routes/types'
// import {useEntitlements} from '#/state/purchases/subscriptions/useEntitlements'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
// import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import * as Layout from '#/components/Layout'
// import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
// import {GradientFill} from '#/components/GradientFill'
// import {Divider} from '#/components/Divider'
// import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
// import * as Dialog from '#/components/Dialog'
// import * as Toggle from '#/components/forms/Toggle'
// import {Admonition} from '#/components/Admonition'

export type ScreenProps = NativeStackScreenProps<
  CommonNavigatorParams,
  'Subscriptions'
>

export function Subscriptions(_props: ScreenProps) {
  const {_} = useLingui()

  // const currentPlatform = isAndroid ? 'android' : isIOS ? 'ios' : 'web'
  // const activeSubscriptionPlatform =
  //   activeSubscription?.subscription?.state?.platform
  // const isManageable =
  //   !activeSubscriptionPlatform ||
  //   activeSubscriptionPlatform === currentPlatform

  return (
    <Layout.Screen>
      <CenteredView sideBorders={true}>
        <ViewHeader title={_(msg`Subscriptions`)} />

        <View style={[a.px_xl, a.py_xl, a.gap_lg]}>
          <Text style={[a.text_2xl]}>Subs</Text>
        </View>
      </CenteredView>
    </Layout.Screen>
  )
}
