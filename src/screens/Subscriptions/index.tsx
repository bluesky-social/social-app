import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {useEntitlements} from '#/state/purchases/subscriptions/useEntitlements'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {SubscriptionsDialog} from '#/components/dialogs/SubscriptionsDialog'
import {Logotype} from '#/components/icons/BlueskyPlus'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export type ScreenProps = NativeStackScreenProps<
  CommonNavigatorParams,
  'Subscriptions'
>

export function Subscriptions(_props: ScreenProps) {
  const {_} = useLingui()
  const {data: entitlements, isLoading: isEntitlementsLoading} =
    useEntitlements()
  const isSubscribed = entitlements?.some(e => e.id === 'core')
  const control = useDialogControl()

  return (
    <Layout.Screen>
      <CenteredView sideBorders={true} style={[a.util_screen_outer]}>
        <View style={[a.px_xl, a.py_xl, a.gap_lg]}>
          <Logotype width={200} fill="nordic" />

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
                  <>
                    <Button
                      label={_('Subscribe')}
                      onPress={() => control.open()}
                      size="large"
                      variant="solid"
                      color="primary">
                      <ButtonText>Subscribe</ButtonText>
                      <ButtonIcon icon={Plus} />
                    </Button>
                    <SubscriptionsDialog control={control} />
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </CenteredView>
    </Layout.Screen>
  )
}
