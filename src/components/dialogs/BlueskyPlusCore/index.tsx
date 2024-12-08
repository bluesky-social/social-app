import React from 'react'
import {View} from 'react-native'
import {PURCHASES_ERROR_CODE} from 'react-native-purchases'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigationState} from '@react-navigation/native'

import {isWeb} from '#/platform/detection'
import {usePurchaseOffering} from '#/state/purchases/hooks/usePurchaseOffering'
import {useSubscriptionGroup} from '#/state/purchases/hooks/useSubscriptionGroup'
import {
  SubscriptionGroupId,
  SubscriptionOfferingId,
} from '#/state/purchases/types'
import {parseOfferingId} from '#/state/purchases/types'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, tokens, useBreakpoints, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as TextField from '#/components/forms/TextField'
import * as Toggle from '#/components/forms/Toggle'
import {GradientFill} from '#/components/GradientFill'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Full as BlueskyPlusLogo} from '#/components/icons/BlueskyPlus'
import {CheckThick_Stroke2_Corner0_Rounded as CheckThink} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {InlineLinkText, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function BlueskyPlusCore({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <DialogInner control={control} />
    </Dialog.Outer>
  )
}

function DialogInner({control}: {control: Dialog.DialogControlProps}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()
  const copy = useCoreOfferingCopy()
  const routes = useNavigationState(state => state.routes)
  const currentRoute = routes.at(routes.length - 1)
  const isOnSubscriptionsPage = currentRoute?.name === 'Subscriptions'
  // TODO if 3p PDS
  const needsEmail = !currentAccount?.email
  const needsConfirmEmail = !currentAccount?.emailConfirmed
  const isDisabled = needsEmail || needsConfirmEmail

  const [email, setEmail] = React.useState('')
  const [error, setError] = React.useState<string>('')
  const [offeringId, setOfferingId] = React.useState<SubscriptionOfferingId>(
    SubscriptionOfferingId.CoreAnnual,
  )
  const {data: coreOffering} = useSubscriptionGroup(SubscriptionGroupId.Core)
  const {mutateAsync: purchaseOffering, isPending} = usePurchaseOffering()

  const onPressSubscribe = async () => {
    setError('')

    async function purchase() {
      if (!currentAccount) return

      const offering = coreOffering?.offerings.find(o => o.id === offeringId)

      if (!offering) {
        const message = _(msg`Hmmmm. We couldn't locate that subscription.`)
        if (isWeb) {
          setError(message)
        } else {
          Toast.show(message, 'xmark')
        }
        return
      }

      const emailValue = email ?? currentAccount.email

      if (!emailValue) {
        const message = _(
          msg`Hmmm. Something went wrong, sorry about that. Please try again.`,
        )
        if (isWeb) {
          setError(message)
        } else {
          Toast.show(message, 'xmark')
        }
        return
      }

      await purchaseOffering({
        did: currentAccount.did,
        email: emailValue,
        offering,
      })
    }

    if (isWeb) {
      try {
        await purchase()
        control.close()
      } catch (e: any) {
        setError(
          _(
            msg`Hmmm. Something went wrong, sorry about that. Please try again.`,
          ),
        )
      }
    } else {
      control.close(async () => {
        try {
          await purchase()
        } catch (e: any) {
          /**
           * @see https://www.revenuecat.com/docs/test-and-launch/errors
           */
          switch (e.code) {
            case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
              // do nothing, just reopen
              break
            default:
              Toast.show(
                _(
                  msg`Hmmm. Something went wrong, sorry about that. Please try again.`,
                ),
                'xmark',
              )
              break
          }

          control.open()
        }
      })
    }
  }

  return (
    <Dialog.ScrollableInner
      label={_(msg`Bluesky Plus`)}
      style={[
        a.overflow_hidden,
        gtMobile ? {width: '100%', maxWidth: 400, minWidth: 200} : a.w_full,
      ]}>
      <BlueskyPlusLogo width={100} gradient="nordic" />

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
        {[
          SubscriptionOfferingId.CoreMonthly,
          SubscriptionOfferingId.CoreAnnual,
        ].map(id => {
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

      {needsEmail ? (
        <View style={[a.pt_md]}>
          <Divider />
          <View style={[a.py_md, a.gap_xs]}>
            <Text
              style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>
                A real email is required in order to receive support and updates
                for your subscription.
              </Trans>
            </Text>
            <TextField.Root>
              <TextField.Icon icon={At} />
              <TextField.Input
                label={_(
                  msg`Enter your email for support and updates to your subscription.`,
                )}
                placeholder={_(msg`Email`)}
                onChangeText={setEmail}
              />
            </TextField.Root>
          </View>

          <Divider />
        </View>
      ) : needsConfirmEmail ? (
        <View style={[a.pt_sm]}>
          <Admonition type="warning" style={[a.flex_1]}>
            <Trans>
              You must verify your email to continue. Without a valid email, we
              can provide no support for your subscription.
            </Trans>{' '}
            <InlineLinkText
              to="/settings/account"
              label={_(msg`Visit account settings`)}>
              <Trans>Click here to begin.</Trans>
            </InlineLinkText>
          </Admonition>
        </View>
      ) : null}

      <View style={[a.flex_row, a.pt_md, a.gap_sm]}>
        {!isOnSubscriptionsPage && (
          <Link
            to="/subscriptions"
            label={_(msg`Learn more about Bluesky+`)}
            variant="solid"
            color="secondary"
            size="large"
            style={[a.flex_1]}>
            <ButtonText style={[a.flex_1]}>
              <Trans>Learn more</Trans>
            </ButtonText>
          </Link>
        )}
        <Button
          label={_(msg`Subscribe`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onPressSubscribe}
          disabled={isPending || isDisabled}
          style={[a.flex_1, a.overflow_hidden]}>
          <GradientFill gradient={tokens.gradients.nordic} />
          <ButtonText style={[{color: 'white'}]}>
            <Trans>Subscribe</Trans>
          </ButtonText>
          <ButtonIcon
            icon={isPending ? Loader : Plus}
            position="right"
            style={[{color: 'white'}]}
          />
        </Button>
      </View>

      {error && (
        <View style={[a.flex_row, a.pt_md, a.gap_sm]}>
          <Admonition type="error" style={[a.flex_1]}>
            {error}
          </Admonition>
        </View>
      )}

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
      [SubscriptionOfferingId.CoreMonthly]: {
        title: _(msg`1 month`),
        price: _(msg`$8 / month`),
        discount: undefined,
      },
      [SubscriptionOfferingId.CoreAnnual]: {
        title: _(msg`12 months`),
        price: _(msg`$72 / year`),
        discount: _(msg`Save 25%`),
      },
    }
  }, [_])
}
