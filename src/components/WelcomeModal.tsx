import {useEffect, useState} from 'react'
import {Pressable, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {FocusGuards, FocusScope} from 'radix-ui/internal'

import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, flatten, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {getActiveBrand} from '#/brand/activeBrand'

interface WelcomeModalProps {
  control: {
    isOpen: boolean
    open: () => void
    close: () => void
  }
}

export function WelcomeModal({control}: WelcomeModalProps) {
  const {_} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const {gtMobile} = useBreakpoints()
  const [isExiting, setIsExiting] = useState(false)
  const [signInLinkHovered, setSignInLinkHovered] = useState(false)

  FocusGuards.useFocusGuards()

  // Brand-driven copy + actions. Omitting `welcomeModal` in a brand suppresses
  // the modal entirely.
  const cfg = getActiveBrand().welcomeModal

  const fadeOutAndClose = (callback?: () => void) => {
    setIsExiting(true)
    setTimeout(() => {
      control.close()
      if (callback) callback()
    }, 150)
  }

  useEffect(() => {
    if (control.isOpen && cfg) {
      ax.metric('welcomeModal:presented', {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [control.isOpen])

  // Hooks must run unconditionally, so bail out after them.
  if (!cfg) return null

  const onPressCreateAccount = () => {
    ax.metric('welcomeModal:signupClicked', {})
    control.close()
    requestSwitchToAccount({requestedAccount: 'new'})
  }

  const onPressSecondary = () => {
    ax.metric('welcomeModal:exploreClicked', {})
    if (cfg.requestInviteUrl) {
      // Web-only component, so window is always available here.
      window.open(cfg.requestInviteUrl, '_blank', 'noopener,noreferrer')
      fadeOutAndClose()
    } else {
      fadeOutAndClose()
    }
  }

  const onPressSignIn = () => {
    ax.metric('welcomeModal:signinClicked', {})
    control.close()
    requestSwitchToAccount({requestedAccount: 'existing'})
  }

  return (
    <View
      role="dialog"
      aria-modal
      style={[
        a.fixed,
        a.inset_0,
        a.justify_center,
        a.align_center,
        {zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.2)'},
        web({backdropFilter: 'blur(15px)'}),
        isExiting ? a.fade_out : a.fade_in,
      ]}>
      <FocusScope.FocusScope asChild loop trapped>
        <View
          style={flatten([
            {
              maxWidth: 800,
              maxHeight: 600,
              width: '90%',
              height: '90%',
            },
            a.rounded_lg,
            a.border,
            a.overflow_hidden,
            a.zoom_in,
            t.atoms.bg,
            t.atoms.border_contrast_low,
          ])}>
          <View style={[a.flex_1, a.justify_center]}>
            <View style={[a.gap_2xl, a.align_center, a.p_4xl]}>
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.justify_center,
                  a.w_full,
                ]}>
                <Logotype width={gtMobile ? 160 : 130} />
              </View>
              <View style={[a.gap_md, a.align_center, a.pt_2xl, a.pb_xl]}>
                <Text
                  style={[
                    gtMobile ? a.text_4xl : a.text_3xl,
                    a.font_semi_bold,
                    a.text_center,
                    t.atoms.text,
                    {lineHeight: gtMobile ? 44 : 36},
                  ]}>
                  {cfg.headline}
                </Text>
                {cfg.attribution && (
                  <Text
                    style={[
                      a.text_md,
                      a.text_center,
                      t.atoms.text_contrast_medium,
                    ]}>
                    {cfg.attribution}
                  </Text>
                )}
                {cfg.subtitle && (
                  <Text
                    style={[
                      a.text_md,
                      a.text_center,
                      a.pt_xs,
                      t.atoms.text_contrast_medium,
                    ]}>
                    {cfg.subtitle}
                  </Text>
                )}
              </View>
              <View style={[a.gap_md, a.align_center]}>
                <View style={[a.gap_sm, {width: gtMobile ? 280 : 240}]}>
                  <Button
                    onPress={onPressCreateAccount}
                    label={cfg.primaryLabel}
                    size="large"
                    color="primary">
                    <ButtonText>{cfg.primaryLabel}</ButtonText>
                  </Button>
                  <Button
                    onPress={onPressSecondary}
                    label={cfg.secondaryLabel}
                    size="large"
                    color="secondary"
                    variant="outline">
                    <ButtonText>{cfg.secondaryLabel}</ButtonText>
                  </Button>
                </View>
                <View style={[a.align_center, {minWidth: 200}]}>
                  <Text
                    style={[
                      a.text_md,
                      a.text_center,
                      t.atoms.text_contrast_medium,
                      {lineHeight: 24},
                    ]}>
                    <Trans>Already have an account?</Trans>{' '}
                    <Pressable
                      onPointerEnter={() => setSignInLinkHovered(true)}
                      onPointerLeave={() => setSignInLinkHovered(false)}
                      accessibilityRole="button"
                      accessibilityLabel={_(msg`Sign in`)}
                      accessibilityHint="">
                      <Text
                        style={[
                          a.font_medium,
                          {color: t.palette.primary_500, fontSize: undefined},
                          signInLinkHovered && a.underline,
                        ]}
                        onPress={onPressSignIn}>
                        <Trans>Sign in</Trans>
                      </Text>
                    </Pressable>
                  </Text>
                </View>
              </View>
            </View>
            <Button
              label={_(msg`Close welcome modal`)}
              style={[a.absolute, {top: 8, right: 8}, a.bg_transparent]}
              hoverStyle={[a.bg_transparent]}
              onPress={() => {
                ax.metric('welcomeModal:dismissed', {})
                fadeOutAndClose()
              }}
              color="secondary"
              size="small"
              variant="ghost"
              shape="round">
              {({hovered, pressed, focused}) => (
                <XIcon
                  size="md"
                  style={[
                    t.atoms.text,
                    {opacity: hovered || pressed || focused ? 1 : 0.7},
                  ]}
                />
              )}
            </Button>
          </View>
        </View>
      </FocusScope.FocusScope>
    </View>
  )
}
