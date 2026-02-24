import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {PROP_1, PROP_2, PROP_3} from './images'
import {Dot, useValuePropText} from './ValuePropositionPager.shared'

export function ValuePropositionPager({
  step,
  avatarUri,
}: {
  step: 0 | 1 | 2
  avatarUri?: string
}) {
  const t = useTheme()
  const {_} = useLingui()

  const image = [PROP_1[t.name], PROP_2[t.name], PROP_3[t.name]][step]

  const {title, description, alt} = useValuePropText(step)

  return (
    <View>
      <View
        style={[
          a.relative,
          a.align_center,
          a.justify_center,
          a.pointer_events_none,
        ]}>
        <Image
          source={image}
          style={[a.w_full, {aspectRatio: 1}]}
          alt={alt}
          accessibilityIgnoresInvertColors={false} // I guess we do need it to blend into the background
        />
        {step === 1 && (
          <Image
            source={avatarUri}
            style={[
              a.z_10,
              a.absolute,
              a.rounded_full,
              {
                width: `${(80 / 393) * 100}%`,
                height: `${(80 / 393) * 100}%`,
              },
            ]}
            accessibilityIgnoresInvertColors
            alt={_(msg`Your profile picture`)}
          />
        )}
      </View>

      <View style={[a.mt_4xl, a.gap_2xl, a.align_center]}>
        <View style={[a.flex_row, a.gap_sm]}>
          <Dot active={step === 0} />
          <Dot active={step === 1} />
          <Dot active={step === 2} />
        </View>

        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_3xl, a.text_center]}>{title}</Text>
          <Text
            style={[
              t.atoms.text_contrast_medium,
              a.text_md,
              a.leading_snug,
              a.text_center,
            ]}>
            {description}
          </Text>
        </View>
      </View>
    </View>
  )
}
