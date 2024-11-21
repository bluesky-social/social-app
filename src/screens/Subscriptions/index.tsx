import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {useSubscriptionsState} from '#/state/purchases/subscriptions/useSubscriptionsState'
import {useSyncPurchases} from '#/state/purchases/subscriptions/useSyncPurchases'
import {useManageSubscription} from '#/state/purchases/subscriptions/useManageSubscription'
import {Subscription} from '#/state/purchases/subscriptions/types'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {BlueskyPlus} from '#/components/dialogs/BlueskyPlus'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {InlineLinkText, createStaticClick} from '#/components/Link'

export type ScreenProps = NativeStackScreenProps<
  CommonNavigatorParams,
  'Subscriptions'
>

export function Subscriptions(_props: ScreenProps) {
  const {_} = useLingui()
  const {data: state, isLoading: isStateLoading} =
    useSubscriptionsState()
  const isSubscribed = state?.entitlements?.some(e => e.id === 'core')
  const control = useDialogControl()

  const {mutateAsync: syncPurchases} = useSyncPurchases()
  const [data, setData] = React.useState<any>(null)

  const sync = async () => {
    try {
      const data = await syncPurchases()
      setData(data)
    } catch (e: any) {
      setData({ message: e.message })
    }
  }

  return (
    <Layout.Screen>
      <Layout.Header title={_(msg`Subscriptions`)} />

      <Layout.Content>
        <CenteredView sideBorders={true} style={[a.util_screen_outer]}>
          <View style={[a.px_xl, a.py_xl, a.gap_lg]}>
              {isStateLoading ? (
                <Loader />
              ) : (
                <>
                  {isSubscribed ? (
                    <CoreSubscriptions subscriptions={state!.subscriptions} />
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
                      <BlueskyPlus control={control} />
                    </>
                  )}
                </>
              )}

              <Button
                label={_('Subscribe')}
                onPress={() => sync()}
                size="large"
                variant="solid"
                color="secondary">
                <ButtonText>Restore Purchase</ButtonText>
                <ButtonIcon icon={Plus} />
              </Button>

              {data && (
                <Text>{JSON.stringify(data, null, 2)}</Text>
              )}
          </View>
        </CenteredView>
      </Layout.Content>
    </Layout.Screen>
  )
}

function CoreSubscriptions(props: { subscriptions: Subscription[] }) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const {mutateAsync: manageSubscription} = useManageSubscription()

  return props.subscriptions.map(sub => (
    <View style={[a.p_lg, a.rounded_md, a.border, a.gap_xs, t.atoms.border_contrast_low]}>
      <Text style={[a.text_lg, a.font_heavy]}>Bluesky+</Text>

      {sub.renews ? (
        <Text style={[a.text_sm]}>
          <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}><Trans>Renews:</Trans></Text>{' '}
          <Text style={[a.text_sm]}>{i18n.date(new Date(sub.periodEndsAt), { dateStyle: "medium", timeStyle: "medium" })}</Text>
        </Text>
      ) : (
        <Text style={[a.text_sm]}>
          <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}><Trans>Ends:</Trans></Text>{' '}
          <Text style={[a.text_sm]}>{i18n.date(new Date(sub.periodEndsAt), { dateStyle: "medium" })}</Text>
        </Text>
      )}

      <InlineLinkText
        label={_('Manage subscription')}
        {...createStaticClick(() => {manageSubscription()})}
      >
        <Trans>Manage subscription</Trans>
      </InlineLinkText>
    </View>
  ))
}
