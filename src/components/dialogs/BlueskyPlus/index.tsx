import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  OfferingId,
  SubscriptionGroupId,
} from '#/state/purchases/subscriptions/types'
import {
  usePurchaseOffering,
  useSubscriptionGroup,
} from '#/state/purchases/subscriptions/useSubscriptionGroup'
import {parseOfferingId} from '#/state/purchases/subscriptions/util'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, tokens, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {GradientFill} from '#/components/GradientFill'
import {Full as BlueskyPlusLogo} from '#/components/icons/BlueskyPlus'
import {CheckThick_Stroke2_Corner0_Rounded as CheckThink} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function BlueskyPlus({control}: {control: Dialog.DialogControlProps}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <DialogInner />
    </Dialog.Outer>
  )
}

function DialogInner() {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()
  const copy = useCoreOfferingCopy()

  const [offeringId, setOfferingId] = React.useState<OfferingId>(
    OfferingId.CoreAnnual,
  )
  const {data: coreOffering} = useSubscriptionGroup(SubscriptionGroupId.Core)
  const {mutateAsync: purchaseOffering, isPending} = usePurchaseOffering()

  const onPressSubscribe = async () => {
    try {
      if (!currentAccount) return

      const offering = coreOffering?.offerings.find(o => o.id === offeringId)
      if (!offering) {
        throw new Error('No offering')
      }

      await purchaseOffering({
        did: currentAccount.did,
        email: currentAccount.email!,
        offering,
      })
    } catch (e: any) {
      Toast.show(_(msg`Could not take you to checkout`), 'xmark')
    }
  }

  return (
    <Dialog.ScrollableInner
      label={_(msg`Bluesky Plus`)}
      style={[
        a.overflow_hidden,
        gtMobile ? {width: '100%', maxWidth: 400, minWidth: 200} : a.w_full,
      ]}>
      <BlueskyPlusLogo width={100} fill="nordic" />

      <Text style={[a.text_3xl, a.font_heavy, a.pt_lg]}>
        <Trans>Let's build the social web.</Trans>
      </Text>

      <Text
        style={[
          a.text_md,
          a.leading_snug,
          a.pt_xs,
          t.atoms.text_contrast_medium,
        ]}>
        <Trans>
          Support Bluesky and get access to exclusive features, custom app
          icons, higher video quality, and more!
        </Trans>
      </Text>

      <Toggle.Group
        type="radio"
        label={_(msg`Choose a Bluesky Plus plan`)}
        values={[offeringId]}
        onChange={values => setOfferingId(parseOfferingId(values[0]))}
        style={[a.w_full, a.gap_sm, a.pt_lg]}>
        {[OfferingId.CoreMonthly, OfferingId.CoreAnnual].map(id => {
          return (
            <Toggle.Item key={id} name={id} label={_(msg`Monthly plan`)}>
              {({selected, hovered}) => (
                <View
                  style={[
                    a.w_full,
                    a.p_md,
                    a.rounded_sm,
                    a.border,
                    a.overflow_hidden,
                    t.atoms.bg,
                    selected
                      ? t.atoms.border_contrast_high
                      : t.atoms.border_contrast_low,
                  ]}>
                  {Boolean(selected || hovered) && (
                    <GradientFill
                      gradient={tokens.gradients.nordic}
                      style={{opacity: 0.1}}
                    />
                  )}
                  <View
                    style={[
                      a.flex_row,
                      a.justify_between,
                      a.align_center,
                      a.gap_sm,
                    ]}>
                    <View style={[a.gap_xs]}>
                      <Text style={[a.text_lg, a.leading_tight, a.font_heavy]}>
                        <Trans>{copy[id].title}</Trans>
                      </Text>
                      <Text
                        style={[
                          a.text_sm,
                          a.leading_tight,
                          t.atoms.text_contrast_medium,
                        ]}>
                        <Trans>{copy[id].price}</Trans>
                      </Text>
                    </View>

                    <View
                      style={[
                        a.flex_row,
                        a.justify_end,
                        a.align_center,
                        a.gap_sm,
                      ]}>
                      {copy[id].discount && (
                        <View
                          style={[
                            a.rounded_full,
                            {
                              backgroundColor: t.atoms.text.color,
                              paddingVertical: 3,
                              paddingHorizontal: 6,
                            },
                          ]}>
                          <Text
                            style={[
                              a.text_xs,
                              a.font_bold,
                              {
                                color: t.atoms.bg.backgroundColor,
                              },
                            ]}>
                            {copy[id].discount}
                          </Text>
                        </View>
                      )}
                      <View
                        style={[
                          a.rounded_full,
                          a.overflow_hidden,
                          a.align_center,
                          a.justify_center,
                          {height: 24, width: 24},
                        ]}>
                        {selected ? (
                          <>
                            <GradientFill gradient={tokens.gradients.nordic} />
                            <CheckThink
                              fill="white"
                              size="xs"
                              style={[a.z_10]}
                            />
                          </>
                        ) : (
                          <View
                            style={[
                              a.absolute,
                              a.inset_0,
                              a.border,
                              a.rounded_full,
                              t.atoms.border_contrast_low,
                            ]}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </Toggle.Item>
          )
        })}
      </Toggle.Group>

      <View style={[a.pt_md]}>
        <Button
          label={_(msg`Subscribe`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onPressSubscribe}
          disabled={isPending}
          style={[a.overflow_hidden]}>
          <GradientFill gradient={tokens.gradients.nordic} />
          <ButtonText style={[t.atoms.text]}>
            <Trans>Subscribe</Trans>
          </ButtonText>
          <ButtonIcon
            icon={isPending ? Loader : Plus}
            position="right"
            style={[t.atoms.text]}
          />
        </Button>
      </View>

      <View style={[a.pt_md]}>
        <Text style={[a.text_xs]}>
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

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function useCoreOfferingCopy() {
  const {_} = useLingui()
  return React.useMemo(() => {
    return {
      [OfferingId.CoreMonthly]: {
        title: _(msg`1 month`),
        price: _(msg`$8 / month`),
        discount: undefined,
      },
      [OfferingId.CoreAnnual]: {
        title: _(msg`12 months`),
        price: _(msg`$72 / year`),
        discount: _(msg`Save 25%`),
      },
    }
  }, [_])
}
