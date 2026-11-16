import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {AboutAtmosphereDialog} from '#/screens/Atmosphere/components/AboutAtmosphereDialog'
import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {atoms as a, tokens, useAlf, utils} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {GradientFill} from '#/components/GradientFill'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/TimesLarge'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function AtmosphereNux() {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {themes} = useAlf()
  const {nux} = useNux(Nux.AtmosphereNux)
  const {mutate: save, variables} = useSaveNux()
  const aboutDialogControl = Dialog.useDialogControl()

  if (variables || nux?.completed) return null

  const dismiss = () => {
    Toast.show(`TEMP: Dismissed the banner. Will remove for production.`)
    return
    save({
      id: Nux.AtmosphereNux,
      completed: true,
      data: undefined,
    })
    ax.metric('atmosphere:nux:bannerDismissed', {})
  }
  const textShadow = {
    textShadowColor: utils.alpha(themes.lightPalette.contrast_975, 0.5),
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  }

  return (
    <View style={[a.pb_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
      <View
        style={[
          a.w_full,
          a.relative,
          a.rounded_md,
          a.overflow_hidden,
          {height: 180},
        ]}>
        <GradientFill gradient={tokens.gradients.sky} />
        <Image
          source={require('../../../../assets/images/atmosphere-tab-banner.webp')}
          contentFit="cover"
          style={[a.absolute, a.inset_0]}
          accessible={false}
        />
        <LinearGradient
          colors={[
            utils.alpha(themes.lightPalette.contrast_975, 0.5),
            utils.alpha(themes.lightPalette.contrast_975, 0.5),
            utils.alpha(themes.lightPalette.contrast_975, 0),
          ]}
          locations={[0, 0.3, 1]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={[a.absolute, a.inset_0]}
        />
        <View
          style={[
            a.absolute,
            a.inset_0,
            a.align_start,
            a.justify_end,
            a.p_lg,
            a.gap_xs,
          ]}>
          <Text
            emoji
            style={[a.text_lg, a.font_bold, {color: 'white'}, textShadow]}
            numberOfLines={2}>
            <Trans>Discover the Atmosphere</Trans>
          </Text>
          <Text
            emoji
            style={[
              a.text_sm,
              a.leading_snug,
              a.pb_sm,
              {color: 'white', maxWidth: 240},
              textShadow,
            ]}
            numberOfLines={4}>
            <Trans>
              Bluesky is part of an open ecosystem of hundreds of apps and
              integrations. Your account unlocks them all.
            </Trans>
          </Text>
          <Button
            label={l`Learn more`}
            accessibilityHint={l`Opens a dialog with more information about the Atmosphere`}
            hitSlop={HITSLOP_10}
            testID="atmosphereNuxLearnMore"
            onPress={aboutDialogControl.open}
            color="primary"
            size="small"
            style={[a.px_md, a.py_xs]}>
            <ButtonText>
              <Trans>Learn more</Trans>
            </ButtonText>
          </Button>
        </View>
        <Button
          label={l`Dismiss info banner`}
          accessibilityHint={l`Hides this banner permanently`}
          hitSlop={HITSLOP_10}
          testID="atmosphereNuxDismiss"
          onPress={dismiss}
          color="secondary"
          shape="round"
          size="tiny"
          style={[
            a.absolute,
            a.align_center,
            a.justify_center,
            {top: a.p_md.padding, right: a.p_md.padding},
          ]}>
          <ButtonIcon icon={XIcon} size="sm" />
        </Button>
      </View>
      <AboutAtmosphereDialog control={aboutDialogControl} />
    </View>
  )
}
