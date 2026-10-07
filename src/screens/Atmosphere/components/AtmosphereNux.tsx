import {View} from 'react-native'
import {Image} from 'expo-image'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/TimesLarge'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
// @ts-expect-error
import discoverAtmosphereNux from '../../../../assets/images/discover_the_atmosphere_nux.webp'

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
    <View
      style={[
        a.w_full,
        a.relative,
        a.rounded_md,
        a.overflow_hidden,
        {aspectRatio: 724 / 418},
      ]}>
      <Image
        source={discoverAtmosphereNux}
        contentFit="cover"
        style={[a.absolute, a.inset_0]}
        accessible={false}
      />
      <View style={[a.absolute, a.inset_0, a.justify_end, a.p_lg]}>
        <View style={{width: '56%'}}>
          <Text
            emoji
            style={[a.text_lg, a.font_bold, {color: 'white'}]}
            numberOfLines={2}>
            <Trans>Discover the Atmosphere</Trans>
          </Text>
          <Text
            emoji
            style={[a.text_sm, a.leading_snug, {color: 'white'}]}
            numberOfLines={4}>
            <Trans>
              Bluesky is part of a growing network of hundreds of social apps.
              Your account unlocks them all.
            </Trans>
          </Text>
        </View>
      </View>
      <Button
        label={l`Dismiss Discover the Atmosphere banner`}
        accessibilityHint={l`Hides this banner from the Explore tab`}
        hitSlop={HITSLOP_10}
        testID="atmosphereNuxDismiss"
        onPress={dismiss}
        style={[
          a.absolute,
          a.align_center,
          a.justify_center,
          {top: 0, right: 7, width: 44, height: 44},
        ]}
        hoverStyle={[a.bg_transparent, {opacity: 0.5}]}>
        <View
          style={[
            a.align_center,
            a.justify_center,
            a.rounded_full,
            {width: 20, height: 20, backgroundColor: 'rgba(0, 0, 0, 0.25)'},
          ]}>
          <XIcon size="xs" style={{color: 'white'}} />
        </View>
      </Button>
    </View>
  )
}
