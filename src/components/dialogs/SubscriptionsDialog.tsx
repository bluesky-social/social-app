import React from 'react'
import {Linking, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useCreateCheckout} from '#/state/purchases/subscriptions/useCreateCheckout'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, tokens, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {GradientFill} from '#/components/GradientFill'
import {Full as BlueskyPlusLogo} from '#/components/icons/BlueskyPlus'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function SubscriptionsDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <DialogInner />
    </Dialog.Outer>
  )
}

function DialogInner() {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()
  const t = useTheme()
  const [plan, setPlan] = React.useState<'monthly' | 'annual'>('monthly')

  const {mutateAsync: createCheckout, isPending} = useCreateCheckout()

  const onPressSubscribe = async () => {
    try {
      if (!currentAccount) return
      const data = await createCheckout({
        did: currentAccount.did,
        email: currentAccount.email!,
        price:
          plan === 'monthly'
            ? 'price_1QLsNLAwTlpRxHkAhuUwbnlL'
            : 'price_1QLsOjAwTlpRxHkAcrV8DL2P',
      })

      if (!data?.checkoutUrl) {
        throw new Error('No checkout URL')
      }

      Linking.openURL(data.checkoutUrl)
    } catch (e: any) {
      Toast.show(_(msg`Could not take you to checkout`), 'xmark')
    }
  }

  return (
    <Dialog.Inner label={_(msg`Bluesky Plus`)} style={[web({maxWidth: 1000})]}>
      <View style={[a.flex_1, a.gap_xl, gtMobile && a.flex_row]}>
        <View
          style={[
            a.flex_1,
            a.gap_md,
            a.rounded_xs,
            a.relative,
            a.overflow_hidden,
          ]}>
          <GradientFill gradient={tokens.gradients.nordic} rotate="270deg" />
          <View style={[a.px_xl, a.py_4xl, a.gap_md]}>
            <MarketingBlurb />
          </View>
        </View>
        <View style={[a.flex_1, a.justify_end, a.gap_md]}>
          <Text style={[a.font_bold, a.text_3xl]}>
            <Trans>Early bird discount!</Trans>
          </Text>
          <Text style={[a.text_lg, a.leading_snug]}>
            <Trans>Support Bluesky now and get a 25% discount for a year</Trans>
          </Text>
          <Toggle.Group
            type="radio"
            label={_(msg`Choose plan`)}
            values={[plan]}
            onChange={values => setPlan(values[0] as 'monthly' | 'annual')}
            style={[a.w_full, a.gap_md, a.my_xl]}>
            <Toggle.Item name="monthly" label={_(msg`Monthly plan`)}>
              {({selected}) => (
                <View
                  style={[
                    a.w_full,
                    a.p_sm,
                    a.rounded_sm,
                    a.flex_row,
                    a.gap_md,
                    a.border,
                    selected
                      ? {borderColor: t.palette.primary_500}
                      : t.atoms.border_contrast_medium,
                  ]}>
                  <Toggle.Radio />
                  <View style={[a.flex_1, a.gap_xs]}>
                    <View
                      style={[
                        a.flex_row,
                        a.flex_wrap,
                        a.justify_between,
                        a.gap_sm,
                      ]}>
                      <Text style={[a.text_lg, a.leading_normal, a.font_bold]}>
                        <Trans>Monthly plan</Trans>
                      </Text>
                      <Text style={[a.text_lg, a.leading_normal, a.font_bold]}>
                        <Trans>$6/month</Trans>
                      </Text>
                    </View>
                    <Text
                      style={[
                        a.text_sm,
                        a.leading_normal,
                        t.atoms.text_contrast_medium,
                      ]}>
                      <Trans>
                        Billed monthly, cancel anytime. $8/month after 12 months
                      </Trans>
                    </Text>
                  </View>
                </View>
              )}
            </Toggle.Item>
            <Toggle.Item name="annual" label={_(msg`Annual plan`)}>
              {({selected}) => (
                <View
                  style={[
                    a.w_full,
                    a.p_sm,
                    a.rounded_sm,
                    a.flex_row,
                    a.gap_md,
                    a.border,
                    selected
                      ? {borderColor: t.palette.primary_500}
                      : t.atoms.border_contrast_medium,
                  ]}>
                  <Toggle.Radio />
                  <View style={[a.flex_1, a.gap_xs]}>
                    <View
                      style={[
                        a.flex_row,
                        a.flex_wrap,
                        a.justify_between,
                        a.gap_sm,
                      ]}>
                      <Text style={[a.text_lg, a.leading_normal, a.font_bold]}>
                        <Trans>Annual plan</Trans>
                      </Text>
                      <Text style={[a.text_lg, a.leading_normal, a.font_bold]}>
                        <Trans>$60/year</Trans>
                      </Text>
                    </View>
                    <Text
                      style={[
                        a.text_sm,
                        a.leading_normal,
                        t.atoms.text_contrast_medium,
                      ]}>
                      <Trans>Billed annually, renews at $80/year</Trans>
                    </Text>
                  </View>
                </View>
              )}
            </Toggle.Item>
          </Toggle.Group>
          <Button
            label={_(msg`Subscribe`)}
            variant="solid"
            color="primary"
            size="large"
            onPress={onPressSubscribe}
            disabled={isPending}>
            <ButtonText>
              <Trans>Subscribe</Trans>
            </ButtonText>
            <ButtonIcon icon={isPending ? Loader : ChevronRightIcon} />
          </Button>
          <Text>
            <InlineLinkText to="#" label="TODO REPLACE">
              Terms and Conditions
            </InlineLinkText>{' '}
            &middot;{' '}
            <InlineLinkText to="#" label="TODO REPLACE">
              Privacy Policy
            </InlineLinkText>{' '}
            &middot;{' '}
            <InlineLinkText to="#" label="TODO REPLACE">
              EULA
            </InlineLinkText>
          </Text>
        </View>
      </View>
      <Dialog.Close />
    </Dialog.Inner>
  )
}

function MarketingBlurb() {
  return (
    <>
      <BlueskyPlusLogo width={200} fill="white" style={[a.mt_5xl]} />

      <Text style={[a.text_lg, a.leading_normal, {color: 'white'}]}>
        <Trans>
          Here's the thing: we don't have any premium features yet because all
          our servers are on fire. Support us now so we can put the fires out
          and get working on those features!
        </Trans>
      </Text>

      <Text
        style={[a.text_lg, a.leading_normal, a.font_bold, {color: 'white'}]}>
        <Trans>What you'll get now:</Trans>
      </Text>
      <View role="list" style={[a.gap_xs]}>
        <Text
          role="listitem"
          style={[a.text_lg, a.leading_normal, {color: 'white'}]}>
          {' '}
          &middot; <Trans>A supporter badge on your profile</Trans>
        </Text>
        <Text
          role="listitem"
          style={[a.text_lg, a.leading_normal, {color: 'white'}]}>
          {' '}
          &middot; <Trans>A warm fuzzy feeling knowing you helped us out</Trans>
        </Text>
      </View>

      <Text
        style={[a.text_lg, a.leading_normal, a.font_bold, {color: 'white'}]}>
        <Trans>What you'll get soon: </Trans>
      </Text>
      <View role="list" style={[a.gap_xs]}>
        <Text
          role="listitem"
          style={[a.text_lg, a.leading_normal, {color: 'white'}]}>
          {' '}
          &middot; <Trans>Custom profile colors</Trans>
        </Text>
        <Text
          role="listitem"
          style={[a.text_lg, a.leading_normal, {color: 'white'}]}>
          {' '}
          &middot; <Trans>Longer and higher quality videos</Trans>
        </Text>
        <Text
          role="listitem"
          style={[a.text_lg, a.leading_normal, {color: 'white'}]}>
          {' '}
          &middot; <Trans>Custom app icons</Trans>
        </Text>
      </View>
    </>
  )
}
