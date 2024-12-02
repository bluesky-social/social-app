import React from 'react'
import {RefreshControl, TextStyle, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {isAndroid, isIOS, isWeb} from '#/platform/detection'
import {PurchasesState, usePurchases, usePurchasesApi} from '#/state/purchases'
import {useManageSubscription} from '#/state/purchases/hooks/useManageSubscription'
import {useNativeUserState} from '#/state/purchases/hooks/useNativeUserState'
import {
  PlatformId,
  SubscriptionGroupId,
  SubscriptionOfferingId,
} from '#/state/purchases/types'
import {
  APISubscription,
  NativePurchaseRestricted,
} from '#/state/purchases/types'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, tokens, useBreakpoints, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {BlueskyPlusCore} from '#/components/dialogs/BlueskyPlusCore'
import {Divider} from '#/components/Divider'
import {GradientFill} from '#/components/GradientFill'
import {AndroidLogo} from '#/components/icons/AndroidLogo'
import {AppleLogo} from '#/components/icons/AppleLogo'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Rotate} from '#/components/icons/ArrowRotateCounterClockwise'
import {Logotype} from '#/components/icons/BlueskyPlus'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Mark} from '#/components/icons/Logo'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {createStaticClick, InlineLinkText, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export type ScreenProps = NativeStackScreenProps<
  CommonNavigatorParams,
  'Subscriptions'
>

export function Subscriptions(_props: ScreenProps) {
  const {_} = useLingui()
  const purchases = usePurchases()
  const {refetch} = usePurchasesApi()
  const {loading, restricted} = useNativeUserState()
  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Layout.Screen>
      <Layout.Header title={_(msg`Subscriptions`)} />

      <Layout.Content
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <CenteredView style={[a.util_screen_outer]}>
          <View style={[a.px_xl, a.py_xl]}>
            {purchases.status === 'loading' || loading ? (
              <Loader />
            ) : purchases.status === 'error' ? (
              <Admonition type="error">
                {purchases.error?.message ?? 'Something went wrong.'}
              </Admonition>
            ) : (
              <Core state={purchases} restricted={restricted} />
            )}
          </View>
        </CenteredView>
      </Layout.Content>
    </Layout.Screen>
  )
}

function Core({
  state,
  restricted,
}: {
  state: Exclude<PurchasesState, {status: 'loading' | 'error'}>
  restricted: NativePurchaseRestricted
}) {
  const t = useTheme()
  const coreSubscriptions = state.subscriptions
    .filter(s => s.group === SubscriptionGroupId.Core)
    .filter(s => {
      return ['active', 'paused'].includes(s.status)
    })
  const isSubscribedToCore = coreSubscriptions.length > 0

  return (
    <View>
      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
        <Mark width={30} gradient="nordic" />
        <Logotype width={90} fill={t.atoms.text.color} />
      </View>

      {restricted === 'yes' ? (
        <Admonition type="info">
          <Trans>
            Another account on this device is already subscribed to Bluesky+.
            Please subscribe additional accounts through our web application.
          </Trans>
        </Admonition>
      ) : isSubscribedToCore ? null : (
        <Purchase />
      )}

      {isSubscribedToCore ? (
        <View style={[a.pt_md, a.gap_lg]}>
          <View style={[a.gap_sm]}>
            {coreSubscriptions.map(sub => (
              <Subscription key={sub.purchasedAt} subscription={sub} />
            ))}
          </View>

          <Divider />

          <InfoCards />
        </View>
      ) : null}

      <View style={[a.pt_lg]}>
        <Text style={[a.text_xs]}>
          <InlineLinkText
            to="#"
            label="TODO REPLACE"
            style={[a.text_xs, t.atoms.text_contrast_medium]}>
            Terms and Conditions
          </InlineLinkText>{' '}
          &middot;{' '}
          <InlineLinkText
            to="#"
            label="TODO REPLACE"
            style={[a.text_xs, t.atoms.text_contrast_medium]}>
            Privacy Policy
          </InlineLinkText>{' '}
          &middot;{' '}
          <InlineLinkText
            to="#"
            label="TODO REPLACE"
            style={[a.text_xs, t.atoms.text_contrast_medium]}>
            EULA
          </InlineLinkText>
        </Text>
      </View>
    </View>
  )
}

function InfoCards() {
  const t = useTheme()
  const {_} = useLingui()
  const {gtPhone} = useBreakpoints()
  const {features} = useFeatures()
  const activeFeatures = features.filter(f => f.available)

  return (
    <View style={[a.flex_row, a.gap_md, a.flex_wrap]}>
      <View
        style={[
          gtPhone ? a.flex_1 : a.w_full,
          a.p_lg,
          a.rounded_md,
          a.gap_sm,
          t.atoms.bg_contrast_25,
        ]}>
        <Text
          style={[
            a.text_sm,
            a.font_bold,
            a.leading_snug,
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>Features</Trans>
        </Text>
        <View style={[a.py_xs, a.gap_sm]}>
          {activeFeatures.map(f => (
            <View key={f.text} style={[a.flex_row, a.align_center, a.gap_xs]}>
              <f.icon fill={t.atoms.text_contrast_low.color} size="xs" />
              <Text style={[a.text_sm]}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View
        style={[
          gtPhone ? a.flex_1 : a.w_full,
          a.p_lg,
          a.rounded_md,
          a.border,
          a.gap_sm,
          t.atoms.border_contrast_low,
        ]}>
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Your support helps Bluesky build a better internet. Thanks for being
            a part of the ATmosphere!
          </Trans>
        </Text>

        <Link
          to="https://blueskyweb.zendesk.com/hc/en-us"
          label={_(msg`Contact support`)}
          size="small"
          variant="solid"
          color="secondary"
          style={[a.justify_center]}>
          <ButtonText>
            <Trans>Get support</Trans>
          </ButtonText>
        </Link>
        <Link
          to="https://blueskyweb.zendesk.com/hc/en-us"
          label={_(msg`Subscriptions FAQ`)}
          size="small"
          variant="outline"
          color="secondary"
          style={[a.justify_center]}>
          <ButtonText>
            <Trans>FAQ</Trans>
          </ButtonText>
        </Link>
      </View>
    </View>
  )
}

function Purchase() {
  const t = useTheme()
  const {_} = useLingui()
  const control = useDialogControl()
  const {features} = useFeatures()

  return (
    <>
      <Text style={[a.text_3xl, a.font_heavy, a.pt_md, a.pb_xs]}>
        <Trans>Building a better internet needs your support.</Trans>
      </Text>

      <View style={[a.gap_xs]}>
        <Text style={[a.text_md, a.leading_snug, a.pt_xs]}>
          <Trans>
            Subscribing to Bluesky+ helps ensure that our work to build an open,
            secure, and user-first internet can continue.
          </Trans>
        </Text>
        <Text style={[a.text_md, a.leading_snug, a.pt_xs]}>
          <Trans>Plus, you'll get access to exclusive features!</Trans>
        </Text>
      </View>

      <View
        style={[
          a.my_md,
          a.p_lg,
          a.gap_sm,
          a.rounded_sm,
          a.border,
          t.atoms.border_contrast_low,
        ]}>
        {features.map(f => (
          <View key={f.text} style={[a.flex_row, a.gap_sm]}>
            <View style={{paddingTop: 2}}>
              <f.icon
                fill={
                  f.available
                    ? tokens.blueskyPlus.mid
                    : t.atoms.text_contrast_low.color
                }
                size="sm"
              />
            </View>
            <Text
              style={[
                a.text_md,
                a.leading_snug,
                f.available ? t.atoms.text : t.atoms.text_contrast_medium,
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
        <ButtonText style={[{color: 'white'}]}>
          <Trans>Subscribe</Trans>
        </ButtonText>
        <ButtonIcon icon={Plus} position="right" style={[{color: 'white'}]} />
      </Button>
      <BlueskyPlusCore control={control} />
    </>
  )
}

export function useSubscriptionUI({
  subscription: sub,
}: {
  subscription: APISubscription
}) {
  const {_, i18n} = useLingui()

  return React.useMemo(() => {
    const periodEndsAt = i18n.date(new Date(sub.periodEndsAt), {
      dateStyle: 'short',
    })
    const title = {
      [SubscriptionOfferingId.CoreMonthly]: _(msg`Monthly`),
      [SubscriptionOfferingId.CoreAnnual]: _(msg`Annual`),
    }[sub.offering]
    const PlatformLogo = {
      [PlatformId.Ios]: AppleLogo,
      [PlatformId.Android]: AndroidLogo,
      [PlatformId.Web]: Globe,
    }[sub.platform]
    const platformName = {
      [PlatformId.Ios]: _('iOS'),
      [PlatformId.Android]: _('Android'),
      [PlatformId.Web]: _('Web'),
    }[sub.platform]
    const status = {
      active: _(msg`Active`),
      expired: _(msg`Expired`),
      paused: _(msg`Paused`),
      unknown: _(msg`Unknown`),
    }[sub.status]
    const renewalStatus = {
      will_renew: _(msg`Renews ${periodEndsAt}`),
      will_not_renew: {
        active: _(msg`Expires ${periodEndsAt}`),
        expired: _(msg`Expired ${periodEndsAt}`),
        paused: _(msg`Expires ${periodEndsAt}`),
        unknown: _(msg`Unknown`),
      }[sub.status],
      will_pause: _(msg`Pauses ${periodEndsAt}`),
      unknown: _(msg`Unknown`),
    }[sub.renewalStatus]
    const RenewalStatusIcon = {
      will_renew: Rotate,
      will_not_renew: Clock,
      will_pause: Clock,
      unknown: Clock,
    }[sub.renewalStatus]

    return {
      title,
      status,
      renewalStatus,
      platformName,
      PlatformLogo,
      RenewalStatusIcon,
    }
  }, [_, i18n, sub])
}

export function Subscription({
  subscription: sub,
}: {
  subscription: APISubscription
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {mutateAsync: manageSubscription} = useManageSubscription()
  const ui = useSubscriptionUI({subscription: sub})

  const canManage =
    (isWeb && sub.platform === PlatformId.Web) ||
    (isIOS && sub.platform === PlatformId.Ios) ||
    (isAndroid && sub.platform === PlatformId.Android)

  const statusStyles = React.useMemo<TextStyle>(() => {
    return {
      active: {
        color: tokens.blueskyPlus.dark,
        backgroundColor: tokens.blueskyPlus.light,
        borderWidth: undefined,
        borderColor: undefined,
      },
      expired: {
        color: t.atoms.text_contrast_medium.color,
        backgroundColor: t.atoms.bg.backgroundColor,
        borderWidth: a.border.borderWidth,
        borderColor: t.atoms.border_contrast_high.borderColor,
      },
      paused: {
        color: t.atoms.bg.backgroundColor,
        backgroundColor: t.atoms.text_contrast_medium.color,
        borderWidth: undefined,
        borderColor: undefined,
      },
      unknown: {
        color: t.atoms.text_contrast_medium.color,
        backgroundColor: t.atoms.bg.backgroundColor,
        borderWidth: a.border.borderWidth,
        borderColor: t.atoms.border_contrast_high.borderColor,
      },
    }[sub.status]
  }, [t, sub.status])

  return (
    <View
      key={sub.purchasedAt}
      style={[a.px_lg, a.rounded_md, a.overflow_hidden]}>
      <GradientFill gradient={tokens.gradients.nordic} />
      <View
        style={[
          a.absolute,
          t.atoms.bg,
          {
            borderRadius: a.rounded_md.borderRadius - 2,
            top: 2,
            bottom: 2,
            left: 2,
            right: 2,
          },
        ]}
      />

      <View
        style={[
          a.flex_row,
          a.justify_between,
          a.align_center,
          {
            paddingTop: 10,
            paddingBottom: 8,
          },
        ]}>
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          <Text style={[a.text_lg, a.font_heavy]}>{ui.title}</Text>

          <Text
            style={[
              a.text_xs,
              a.rounded_full,
              a.font_bold,
              {
                paddingVertical: 2,
                paddingHorizontal: 6,
                ...statusStyles,
              },
            ]}>
            {ui.status}
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

      <Divider />

      <View
        style={[
          a.flex_row,
          a.gap_md,
          a.align_center,
          {
            paddingTop: 8,
            paddingBottom: 10,
          },
        ]}>
        <View
          style={[
            a.flex_row,
            a.justify_between,
            a.align_center,
            a.gap_xs,
            {left: -1},
          ]}>
          <ui.PlatformLogo size="sm" fill={t.atoms.text_contrast_low.color} />
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {ui.platformName}
          </Text>
        </View>

        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          <ui.RenewalStatusIcon
            size="sm"
            fill={t.atoms.text_contrast_low.color}
          />
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {ui.renewalStatus}
          </Text>
        </View>
      </View>
    </View>
  )
}

function useFeatures() {
  const {_} = useLingui()

  const features = [
    {
      available: true,
      icon: Check,
      text: _(msg`Bluesky+ profile badge`),
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

  return {
    features,
  }
}
