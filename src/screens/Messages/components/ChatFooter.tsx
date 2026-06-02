import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Text} from '#/components/Typography'

export function ChatFooter({
  children,
  heading,
  subheading,
  icon: Icon,
}: React.PropsWithChildren<{
  heading: string
  subheading?: string
  icon: React.ComponentType<SVGIconProps>
}>) {
  const t = useTheme()

  return (
    <View style={[a.p_lg]}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.p_md,
          a.rounded_full,
          t.atoms.bg_contrast_50,
        ]}>
        <View
          style={[
            a.flex_row,
            a.align_center,
            {
              minHeight: 32,
            },
          ]}>
          <Icon
            size="md"
            fill={t.atoms.text_contrast_medium.color}
            style={[a.mr_sm]}
          />
          <View>
            <Text
              numberOfLines={1}
              style={[
                a.text_sm,
                a.font_semi_bold,
                t.atoms.text_contrast_medium,
              ]}>
              {heading}
            </Text>
            {subheading ? (
              <Text
                numberOfLines={1}
                style={[
                  a.text_xs,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                {subheading}
              </Text>
            ) : null}
          </View>
        </View>
        {children}
      </View>
    </View>
  )
}
