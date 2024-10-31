import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {isAndroid, isIOS} from '#/platform/detection'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {
  useMainSubscriptions,
  usePurchaseSubscription,
  useChangeSubscription,
  useCancelSubscription,
} from '#/state/purchases/subscriptions'
// import {useEntitlements} from '#/state/purchases/subscriptions/useEntitlements'
import {
  SubscriptionTier,
  Subscription,
  SubscriptionId,
  TierId,
} from '#/state/purchases/subscriptions/types'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useTheme, useBreakpoints, tokens} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useMainSubscriptionTiersCopy} from '#/components/subscriptions/localization'
import {GradientFill} from '#/components/GradientFill'
import {Divider} from '#/components/Divider'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Admonition} from '#/components/Admonition'

export type ScreenProps = NativeStackScreenProps<
  CommonNavigatorParams,
  'Subscriptions'
>

export function Subscriptions(_props: ScreenProps) {
  const {_} = useLingui()

  // const {data: entitlements} = useEntitlements()
  const {data: subscriptions, isError} = useMainSubscriptions()
  const activeSubscription = React.useMemo(() => {
    if (!subscriptions) return
    for (const sub of subscriptions) {
      if (sub.monthly.subscription.state?.active) {
        return sub.monthly
      } else if (sub.annual.subscription.state?.active) {
        return sub.annual
      }
    }
  }, [subscriptions])
  const currentPlatform = isAndroid ? 'android' : isIOS ? 'ios' : 'web'
  const activeSubscriptionPlatform =
    activeSubscription?.subscription?.state?.platform
  const isManageable =
    !activeSubscriptionPlatform ||
    activeSubscriptionPlatform === currentPlatform

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
            <>
              {subscriptions.map(s => (
                <SubscriptionCard
                  key={s.id}
                  subscription={s}
                  activeSubscription={activeSubscription}
                  isManageable={isManageable}
                />
              ))}

              {!isManageable ? (
                <Admonition type="info">
                  <Trans>
                    You purchased this subscription on{' '}
                    {activeSubscriptionPlatform}. Please access this screen on{' '}
                    {activeSubscriptionPlatform} to manage your plan.
                  </Trans>
                </Admonition>
              ) : null}
            </>
          )}
        </View>
      </CenteredView>
    </Layout.Screen>
  )
}

export function SubscriptionCard({
  subscription: s,
  activeSubscription,
  isManageable,
}: {
  subscription: SubscriptionTier
  activeSubscription?: Subscription
  isManageable: boolean
}) {
  const t = useTheme()
  const {i18n} = useLingui()
  const copy = useMainSubscriptionTiersCopy()

  const activePlan = React.useMemo(() => {
    if (s.monthly.subscription.state?.active) {
      return s.monthly
    } else if (s.annual.subscription.state?.active) {
      return s.annual
    }
  }, [s])
  const isMonthly = s.monthly.subscription.state?.active
  const isAnnual = s.annual.subscription.state?.active
  const isActive = isMonthly || isAnnual

  const gradient = React.useMemo(() => {
    return {
      [TierId.Main0]: tokens.gradients.sky,
      [TierId.Main1]: tokens.gradients.sunrise,
      [TierId.Main2]: tokens.gradients.bonfire,
    }[s.id]
  }, [s.id])

  const control = Dialog.useDialogControl()

  return (
    <View style={[a.w_full]}>
      <Button
        disabled={!isManageable}
        label={copy[s.id].title}
        style={[a.w_full]}
        onPress={() => control.open()}>
        {ctx => (
          <View
            style={[
              a.w_full,
              a.rounded_md,
              a.overflow_hidden,
              a.border,
              ctx.hovered
                ? t.atoms.border_contrast_high
                : t.atoms.border_contrast_low,
            ]}>
            <View
              style={[
                a.relative,
                a.w_full,
                {
                  paddingTop: '10%',
                },
              ]}>
              <GradientFill gradient={gradient} />
              {isActive && (
                <View
                  style={[
                    a.absolute,
                    a.inset_0,
                    a.align_center,
                    a.justify_center,
                    a.pr_lg,
                    {
                      left: 'auto',
                    },
                  ]}>
                  <Check fill="white" />
                </View>
              )}
            </View>
            <View style={[a.p_lg]}>
              <Text style={[a.text_2xl, a.font_heavy]}>{copy[s.id].title}</Text>

              {activePlan && activePlan.subscription.state && (
                <View style={[a.gap_xs, a.pt_md]}>
                  <Text style={[a.text_md, a.font_bold]}>Current</Text>
                  <Text>• {activePlan.subscription.interval}</Text>
                  <Text>
                    • renews{' '}
                    {i18n.date(
                      new Date(activePlan.subscription.state?.periodEnd),
                      {dateStyle: 'medium'},
                    )}
                  </Text>
                </View>
              )}

              {isManageable && (
                <>
                  <Divider style={[a.my_md]} />

                  <View style={[a.flex_row, a.align_center]}>
                    {s.annual.price && s.monthly.price ? (
                      <Text>
                        <Trans>
                          <Text style={[a.text_xl, a.font_heavy]}>
                            {s.monthly.price.formatted}
                          </Text>
                          <Text style={[a.text_sm, a.font_bold]}>
                            /month{'  •  '}
                            <Text
                              style={[
                                a.text_sm,
                                a.font_normal,
                                t.atoms.text_contrast_medium,
                              ]}>
                              <Trans>or {s.annual.price?.formatted}/year</Trans>
                            </Text>
                          </Text>
                        </Trans>
                      </Text>
                    ) : null}
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </Button>

      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <SubscriptionDialog
          subscription={s}
          activeSubscription={activeSubscription}
        />
      </Dialog.Outer>
    </View>
  )
}

function SubscriptionDialog({
  subscription: s,
  activeSubscription,
}: {
  subscription: SubscriptionTier
  activeSubscription?: Subscription
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {close} = Dialog.useDialogContext()
  const {gtMobile} = useBreakpoints()
  const copy = useMainSubscriptionTiersCopy()

  const activeSubscriptionId = activeSubscription?.id
  const tierSubscriptions = [s.monthly, s.annual]
  console.log('tierSubscriptions', tierSubscriptions)
  const initiallySelectedSubscription = tierSubscriptions.find(
    s => s.id === activeSubscriptionId,
  )
  const isTierActive = !!initiallySelectedSubscription
  const [values, setValues] = React.useState<SubscriptionId[]>(
    initiallySelectedSubscription ? [initiallySelectedSubscription.id] : [],
  )
  const selectedSubscription = tierSubscriptions.find(s => s.id === values[0])

  const isEditing =
    activeSubscription && selectedSubscription?.id !== activeSubscription.id
  const purchaseDisabled =
    !selectedSubscription ||
    (activeSubscription && selectedSubscription?.id === activeSubscription.id)

  const {mutateAsync: purchaseSubscription, isPending: isPurchasePending} =
    usePurchaseSubscription()
  const {mutateAsync: changeSubscription, isPending: isChangePending} =
    useChangeSubscription()
  const {mutateAsync: cancelSubscription, isPending: isCancelPending} =
    useCancelSubscription()
  const purchase = React.useCallback(async () => {
    if (selectedSubscription) {
      console.log(selectedSubscription)
      await purchaseSubscription(selectedSubscription)
    }
  }, [selectedSubscription, purchaseSubscription])
  const change = React.useCallback(async () => {
    const prev = activeSubscription
    const next = selectedSubscription

    if (!prev || !next) {
      throw new Error('Invalid subscription change')
    }

    await changeSubscription({
      prev,
      next,
    })
    close()
  }, [activeSubscription, selectedSubscription, close])
  const cancel = React.useCallback(async () => {
    if (activeSubscription) {
      await cancelSubscription(activeSubscription)
      close()
    }
  }, [activeSubscription, cancelSubscription, close])
  const action = isEditing ? change : purchase
  const isPending = isPurchasePending || isChangePending
  const canCancel = isTierActive && activeSubscription?.platform === 'web'

  return (
    <Dialog.ScrollableInner
      label={copy[s.id].title}
      style={[
        gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
      ]}>
      <Text style={[a.text_2xl, a.font_heavy, a.pb_md]}>
        {copy[s.id].title}
      </Text>

      <Toggle.Group
        label={_(msg`Select plan`)}
        type="radio"
        values={values}
        onChange={setValues}>
        <View style={[a.flex_row, a.gap_md, a.pb_md]}>
          {tierSubscriptions.map(s => (
            <Toggle.Item
              key={s.id}
              label={_(msg`Billed annually`)}
              type="radio"
              name={s.id}
              style={[a.flex_1]}>
              {state => (
                <View
                  style={[
                    a.w_full,
                    a.p_md,
                    a.rounded_sm,
                    a.border,
                    t.atoms.border_contrast_low,
                    {
                      borderColor: state.selected
                        ? t.palette.primary_500
                        : t.atoms.border_contrast_low.borderColor,
                    },
                  ]}>
                  <Text style={[a.text_2xl, a.font_heavy]}>
                    {s.price?.formatted}
                  </Text>
                </View>
              )}
            </Toggle.Item>
          ))}
        </View>
      </Toggle.Group>

      <View style={[a.gap_md]}>
        <Button
          label={_(msg`Purchase`)}
          disabled={purchaseDisabled}
          size="large"
          variant="solid"
          color="primary"
          onPress={action}>
          <ButtonText>{isEditing ? 'Update' : 'Purchase'}</ButtonText>
          {isPending && <ButtonIcon icon={Loader} />}
        </Button>

        {canCancel ? (
          <Button
            label={_(msg`Cancel subscription`)}
            size="large"
            variant="solid"
            color="secondary"
            onPress={cancel}>
            <ButtonText>Cancel</ButtonText>
            {isCancelPending && <ButtonIcon icon={Loader} />}
          </Button>
        ) : null}
      </View>
    </Dialog.ScrollableInner>
  )
}
