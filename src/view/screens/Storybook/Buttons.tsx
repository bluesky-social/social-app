import {Fragment} from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {
  Button,
  type ButtonColor,
  ButtonIcon,
  type ButtonSize,
  ButtonText,
} from '#/components/Button'
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft} from '#/components/icons/Chevron'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Text} from '#/components/Typography'

export function Buttons() {
  return (
    <View style={[a.gap_md]}>
      <Text style={[a.font_bold, a.text_5xl]}>Buttons</Text>

      {[
        'primary',
        'secondary',
        'secondary_inverted',
        'negative',
        'primary_subtle',
        'negative_subtle',
      ].map(color => (
        <Fragment key={color}>
          {['tiny', 'small', 'large'].map(size => (
            <Fragment key={size}>
              <Text style={[a.font_bold, a.text_2xl]}>
                color={color} size={size}
              </Text>
              <View style={[a.flex_row, a.align_start, a.gap_md]}>
                <Button
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  label="Click here">
                  <ButtonText>Button</ButtonText>
                </Button>
                <Button
                  disabled
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  label="Click here">
                  <ButtonText>Button</ButtonText>
                </Button>
                <Button
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  shape="round"
                  label="Click here">
                  <ButtonIcon icon={ChevronLeft} />
                </Button>
                <Button
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  shape="square"
                  label="Click here">
                  <ButtonIcon icon={ChevronLeft} />
                </Button>
              </View>
              <View style={[a.flex_row, a.gap_md]}>
                <Button
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  label="Click here">
                  <ButtonIcon icon={Globe} position="left" />
                  <ButtonText>Button</ButtonText>
                </Button>
                <Button
                  disabled
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  label="Click here">
                  <ButtonText>Button</ButtonText>
                  <ButtonIcon icon={Globe} position="right" />
                </Button>
              </View>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </View>
  )
}
