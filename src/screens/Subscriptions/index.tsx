import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {isAndroid, isIOS, isWeb} from '#/platform/detection'
import {PurchasesState, usePurchases} from '#/state/purchases'
import {useManageSubscription} from '#/state/purchases/hooks/useManageSubscription'
import {
  PlatformId,
  SubscriptionGroupId,
  SubscriptionOfferingId,
} from '#/state/purchases/types'
import {APISubscription} from '#/state/purchases/types'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {BlueskyPlus} from '#/components/dialogs/BlueskyPlus'
import {Divider} from '#/components/Divider'
import {GradientFill} from '#/components/GradientFill'
import {AndroidLogo} from '#/components/icons/AndroidLogo'
import {AppleLogo} from '#/components/icons/AppleLogo'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Rotate} from '#/components/icons/ArrowRotateCounterClockwise'
import {Full as BlueskyPlusLogo, Logotype} from '#/components/icons/BlueskyPlus'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {createStaticClick, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export type ScreenProps = NativeStackScreenProps<
  CommonNavigatorParams,
  'Subscriptions'
>

export function Subscriptions(_props: ScreenProps) {
  const {_} = useLingui()
  const purchases = usePurchases()

  return (
    <Layout.Screen>
      <Layout.Header title={_(msg`Subscriptions`)} />

      <Layout.Content>
        <CenteredView style={[a.util_screen_outer]}>
          <View style={[a.px_xl, a.py_xl]}>
            {purchases.status === 'loading' ? (
              <Loader />
            ) : purchases.status === 'error' ? (
              <View />
            ) : (
              <Core state={purchases} />
            )}
          </View>
        </CenteredView>
      </Layout.Content>
    </Layout.Screen>
  )
}

function Core({
  state,
}: {
  state: Exclude<PurchasesState, {status: 'loading' | 'error'}>
}) {
  const t = useTheme()
  const {_} = useLingui()
  const control = useDialogControl()
  const coreSubscriptions = state.subscriptions.filter(
    s => s.group === SubscriptionGroupId.Core,
  )
  const isSubscribedToCore = !!coreSubscriptions.length

  const features = [
    {
      available: true,
      icon: Check,
      text: _(msg`Bluesky+ supporter badge`),
    },
    {
      available: true,
      icon: Check,
      text: _(msg`Custom app icons`),
    },
    {
      available: true,
      icon: Check,
      text: _(msg`Profile customizations`),
    },
    {
      available: true,
      icon: Check,
      text: _(msg`Higher video upload limits`),
    },
    {
      available: true,
      icon: Check,
      text: _(msg`High quality video resolution`),
    },
    {
      available: false,
      icon: Clock,
      text: _(msg`Inline post translations (coming soon)`),
    },
    {
      available: false,
      icon: Clock,
      text: _(msg`Post analytics (coming soon)`),
    },
    {
      available: false,
      icon: Clock,
      text: _(msg`Bookmark folders (coming soon)`),
    },
  ]

  return (
    <View style={[]}>
      {isSubscribedToCore ? (
        <CoreSubscriptions subscriptions={state.subscriptions} />
      ) : null}

      {!isSubscribedToCore && (
        <>
          {state.config.nativePurchaseRestricted === 'yes' ? (
            <View style={[a.pt_md]}>
              <Admonition type="info">
                <Trans>
                  Another account on this device is already subscribed to
                  Bluesky+. Please subscribe additional accounts through our web
                  application.
                </Trans>
              </Admonition>
            </View>
          ) : (
            <>
              <BlueskyPlusLogo width={130} gradient="nordic" />

              <Text style={[a.text_3xl, a.font_heavy, a.pt_md, a.pb_xs]}>
                <Trans>Building a better internet needs your support.</Trans>
              </Text>

              <View style={[a.gap_xs]}>
                <Text
                  style={[
                    a.text_md,
                    a.leading_snug,
                    a.pt_xs,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>
                    Subscribing to Bluesky+ helps ensure that our work to build
                    an open, secure, and user-first internet can continue.
                  </Trans>
                </Text>
                <Text
                  style={[
                    a.text_md,
                    a.leading_snug,
                    a.pt_xs,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>Plus, you'll get access to exclusive features!</Trans>
                </Text>
              </View>

              <View
                style={[
                  a.my_md,
                  a.p_lg,
                  a.gap_sm,
                  a.rounded_sm,
                  t.atoms.bg_contrast_25,
                ]}>
                {features.map(f => (
                  <View key={f.text} style={[a.flex_row, a.gap_md]}>
                    <View style={{paddingTop: 2}}>
                      <f.icon
                        fill={
                          f.available
                            ? t.palette.primary_500
                            : t.atoms.text_contrast_low.color
                        }
                        size="sm"
                      />
                    </View>
                    <Text
                      style={[
                        a.text_md,
                        a.leading_snug,
                        f.available
                          ? t.atoms.text
                          : t.atoms.text_contrast_medium,
                      ]}>
                      {f.text}
                    </Text>
                  </View>
                ))}
              </View>

              <Button
                label={_('Subscribe')}
                onPress={() => control.open()}
                size="large"
                variant="solid"
                color="primary"
                style={[a.overflow_hidden]}>
                <GradientFill gradient={tokens.gradients.nordic} />
                <ButtonText style={[t.atoms.text]}>
                  <Trans>Subscribe</Trans>
                </ButtonText>
                <ButtonIcon
                  icon={Plus}
                  position="right"
                  style={[t.atoms.text]}
                />
              </Button>
              <BlueskyPlus control={control} />
            </>
          )}
        </>
      )}

      {/*
      <View style={[a.pt_md]}>
        <Text style={[a.mb_md, a.text_xs]}>
          <InlineLinkText
            to="#"
            label="TODO REPLACE"
            style={[a.text_xs, t.atoms.text_contrast_low]}>
            Terms and Conditions
          </InlineLinkText>{' '}
          &middot;{' '}
          <InlineLinkText
            to="#"
            label="TODO REPLACE"
            style={[a.text_xs, t.atoms.text_contrast_low]}>
            Privacy Policy
          </InlineLinkText>{' '}
          &middot;{' '}
          <InlineLinkText
            to="#"
            label="TODO REPLACE"
            style={[a.text_xs, t.atoms.text_contrast_low]}>
            EULA
          </InlineLinkText>
        </Text>
      </View>
        */}
    </View>
  )
}

function CoreSubscriptions(props: {subscriptions: APISubscription[]}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const {mutateAsync: manageSubscription} = useManageSubscription()

  const copy = React.useMemo(() => {
    return {
      [SubscriptionOfferingId.CoreMonthly]: {
        title: _(msg`Monthly`),
      },
      [SubscriptionOfferingId.CoreAnnual]: {
        title: _(msg`Annual`),
      },
    }
  }, [_])

  return props.subscriptions.map(sub => {
    const endDate = i18n.date(new Date(sub.periodEndsAt), {dateStyle: 'medium'})
    const StatusIcon = sub.renews ? Rotate : Clock
    const c = copy[sub.offering]
    const canManage =
      (isWeb && sub.platform === PlatformId.Web) ||
      (isIOS && sub.platform === PlatformId.Ios) ||
      (isAndroid && sub.platform === PlatformId.Android)
    const PlatformIcon = {
      [PlatformId.Ios]: AppleLogo,
      [PlatformId.Android]: AndroidLogo,
      [PlatformId.Web]: Globe,
    }[sub.platform]
    return (
      <View
        key={sub.purchasedAt}
        style={[
          a.p_md,
          a.px_lg,
          a.rounded_md,
          a.border,
          a.gap_xs,
          a.overflow_hidden,
          t.atoms.border_contrast_low,
        ]}>
        <View
          style={[
            a.flex_row,
            a.justify_between,
            a.align_center,
            {paddingBottom: 6},
          ]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <Logotype width={75} fill={t.atoms.text.color} />

            <Text
              style={[
                a.text_sm,
                a.rounded_full,
                a.font_bold,
                {
                  paddingVertical: 3,
                  paddingHorizontal: 5,
                  backgroundColor: tokens.blueskyPlus.dark,
                  color: tokens.blueskyPlus.light,
                },
              ]}>
              {c.title}
            </Text>

            <Text
              style={[
                a.text_sm,
                a.rounded_full,
                a.font_bold,
                {
                  paddingVertical: 3,
                  paddingHorizontal: 5,
                  borderWidth: sub.renews ? 0 : a.border.borderWidth,
                  borderColor: t.palette.negative_500,
                  backgroundColor: sub.renews
                    ? tokens.blueskyPlus.light
                    : t.atoms.bg.backgroundColor,
                  color: sub.renews
                    ? tokens.blueskyPlus.dark
                    : t.atoms.text.color,
                },
              ]}>
              {sub.renews ? <Trans>Active</Trans> : <Trans>Cancelled</Trans>}
            </Text>
          </View>

          <View style={[a.flex_row, a.align_center, a.gap_xs]}>
            <StatusIcon size="sm" fill={t.atoms.text_contrast_low.color} />
            <Text style={[a.text_sm, a.font_bold]}>{endDate}</Text>
          </View>
        </View>

        <Divider />

        <View
          style={[
            a.flex_row,
            a.justify_between,
            a.align_center,
            {paddingTop: 6},
          ]}>
          <View
            style={[
              a.flex_row,
              a.justify_between,
              a.align_center,
              a.gap_xs,
              {left: -1},
            ]}>
            <PlatformIcon size="md" fill={t.atoms.text_contrast_low.color} />
            <Text
              style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
              <Trans>Managed via web</Trans>
            </Text>
          </View>

          {canManage && (
            <Link
              label={_('Manage subscription')}
              size="tiny"
              variant="solid"
              color="secondary_inverted"
              {...createStaticClick(() => {
                manageSubscription()
              })}
              style={[a.justify_center]}>
              <ButtonText>
                <Trans>Manage</Trans>
              </ButtonText>
            </Link>
          )}
        </View>
      </View>
    )
  })
}
