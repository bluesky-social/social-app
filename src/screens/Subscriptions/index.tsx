import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {PurchasesState,usePurchases} from '#/state/purchases'
import {useManageSubscription} from '#/state/purchases/hooks/useManageSubscription'
import {SubscriptionGroupId} from '#/state/purchases/types'
import {APISubscription} from '#/state/purchases/types'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, tokens,useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {BlueskyPlus} from '#/components/dialogs/BlueskyPlus'
import {GradientFill} from '#/components/GradientFill'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Rotate} from '#/components/icons/ArrowRotateCounterClockwise'
import {Full as BlueskyPlusLogo} from '#/components/icons/BlueskyPlus'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {SettingsGear2_Stroke2_Corner0_Rounded as Gear} from '#/components/icons/SettingsGear2'
import * as Layout from '#/components/Layout'
import {createStaticClick,InlineLinkText, Link} from '#/components/Link'
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
        <CenteredView sideBorders={true} style={[a.util_screen_outer]}>
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
  console.log(state)

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
    <View style={[a.pt_sm]}>
      <BlueskyPlusLogo width={130} fill="nordic" />

      {isSubscribedToCore ? (
        <View style={[a.pt_md]}>
          <CoreSubscriptions subscriptions={state.subscriptions} />
        </View>
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

        <Admonition type="tip">
          <Trans>
            Learn more about Bluesky+ and our roadmap{' '}
            <InlineLinkText
              to="https://bsky.social/about"
              label={_(msg`Learn more in our FAQ`)}>
              here
            </InlineLinkText>
          </Trans>
        </Admonition>
      </View>
    </View>
  )
}

function CoreSubscriptions(props: {subscriptions: APISubscription[]}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const {mutateAsync: manageSubscription} = useManageSubscription()

  return props.subscriptions.map(sub => {
    const endDate = i18n.date(new Date(sub.periodEndsAt), {dateStyle: 'medium'})
    const StatusIcon = sub.renews ? Rotate : Clock
    return (
      <View
        key={sub.purchasedAt}
        style={[
          a.p_lg,
          a.py_md,
          a.rounded_md,
          a.border,
          a.gap_xs,
          a.overflow_hidden,
          t.atoms.border_contrast_low,
        ]}>
        <GradientFill
          gradient={tokens.gradients.nordic}
          style={{opacity: 0.1}}
        />

        <View style={[a.flex_row, a.justify_between, a.align_center]}>
          <View>
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <Text
                style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
                Active
              </Text>
            </View>

            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <StatusIcon size="sm" fill={t.atoms.text_contrast_low.color} />
              <Text style={[a.text_sm]}>{endDate}</Text>
            </View>
          </View>
          <Link
            label={_('Manage subscription')}
            size="small"
            variant="ghost"
            shape="round"
            {...createStaticClick(() => {
              manageSubscription()
            })}
            style={[a.justify_center]}>
            <ButtonIcon icon={Gear} size="lg" />
          </Link>
        </View>
      </View>
    )
  })
}
