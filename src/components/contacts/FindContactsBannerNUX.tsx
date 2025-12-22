import {useMemo} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {useGate} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {Link} from '../Link'
import {useIsFindContactsFeatureEnabledBasedOnGeolocation} from './country-allowlist'

export function FindContactsBannerNUX() {
  const t = useTheme()
  const {_} = useLingui()
  const {visible, close} = useInternalState()

  if (!visible) return null

  return (
    <View style={[a.w_full, a.p_lg, a.border_b, t.atoms.border_contrast_low]}>
      <View style={a.w_full}>
        <Link
          to={{screen: 'FindContactsFlow'}}
          label={_(msg`Import contacts to find your friends`)}
          onPress={() => {
            logger.metric('contacts:nux:bannerPressed', {})
          }}
          style={[
            a.w_full,
            a.rounded_xl,
            a.curve_continuous,
            a.overflow_hidden,
          ]}>
          <LinearGradient
            colors={[t.palette.primary_200, t.palette.primary_50]}
            start={{x: 0, y: 0.5}}
            end={{x: 1, y: 0.5}}
            style={[
              a.w_full,
              a.h_full,
              a.flex_row,
              a.align_center,
              a.gap_lg,
              a.pl_lg,
            ]}>
            <Image
              source={require('../../../assets/images/find_friends_illustration_small.webp')}
              accessibilityIgnoresInvertColors
              style={[
                {height: 70, aspectRatio: 573 / 286},
                a.self_end,
                a.mt_sm,
              ]}
            />
            <View style={[a.flex_1, a.justify_center, a.py_xl, a.pr_5xl]}>
              <Text
                style={[
                  a.text_md,
                  a.font_bold,
                  {color: t.palette.primary_900},
                ]}>
                <Trans>Import contacts to find your friends</Trans>
              </Text>
            </View>
          </LinearGradient>
        </Link>
        <Button
          label={_(msg`Dismiss banner`)}
          hitSlop={HITSLOP_10}
          onPress={close}
          style={[a.absolute, {top: 14, right: 14}]}
          hoverStyle={[a.bg_transparent, {opacity: 0.5}]}>
          <XIcon size="xs" style={[t.atoms.text_contrast_low]} />
        </Button>
      </View>
    </View>
  )
}
function useInternalState() {
  const {nux} = useNux(Nux.FindContactsDismissibleBanner)
  const {mutate: save, variables} = useSaveNux()
  const hidden = !!variables
  const isFeatureEnabled = useIsFindContactsFeatureEnabledBasedOnGeolocation()
  const gate = useGate()

  const visible = useMemo(() => {
    if (isWeb) return false
    if (hidden) return false
    if (nux && nux.completed) return false
    if (!isFeatureEnabled) return false
    if (gate('disable_settings_find_contacts')) return false
    return true
  }, [hidden, nux, isFeatureEnabled, gate])

  const close = () => {
    save({
      id: Nux.FindContactsDismissibleBanner,
      completed: true,
      data: undefined,
    })
    logger.metric('contacts:nux:bannerDismissed', {})
  }

  return {visible, close}
}
