import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {atoms as a, tokens} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {GradientFill} from '#/components/GradientFill'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/TimesLarge'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function AtmosphereNux() {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {nux} = useNux(Nux.AtmosphereNux)
  const {mutate: save, variables} = useSaveNux()

  if (variables || nux?.completed) return null

  const dismiss = () => {
    save({
      id: Nux.AtmosphereNux,
      completed: true,
      data: undefined,
    })
    ax.metric('atmosphere:nux:bannerDismissed', {})
  }

  return (
    <View style={a.pb_md}>
      <View
        style={[
          a.w_full,
          a.relative,
          a.rounded_md,
          a.overflow_hidden,
          {height: 180},
        ]}>
        {/*
        <Image
          source={discoverAtmosphereNux}
          contentFit="cover"
          style={[a.absolute, a.inset_0]}
          accessible={false}
        />
        */}
        <GradientFill gradient={tokens.gradients.sky} />
        <View style={[a.absolute, a.inset_0, a.justify_end, a.p_lg, a.gap_xs]}>
          <Text
            emoji
            style={[a.text_lg, a.font_bold, {color: 'white'}]}
            numberOfLines={2}>
            <Trans>Discover the Atmosphere</Trans>
          </Text>
          <Text
            emoji
            style={[a.text_sm, a.leading_snug, {color: 'white', maxWidth: 260}]}
            numberOfLines={4}>
            <Trans>
              Bluesky is part of a growing network of hundreds of social apps.
              Your account unlocks them all.
            </Trans>
          </Text>
        </View>
        <Button
          label={l`Dismiss Discover the Atmosphere banner`}
          accessibilityHint={l`Hides this banner from the Explore tab`}
          hitSlop={HITSLOP_10}
          testID="atmosphereNuxDismiss"
          onPress={dismiss}
          color="secondary_inverted"
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
    </View>
  )
}
