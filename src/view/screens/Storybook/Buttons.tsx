import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {
  Button,
  ButtonVariant,
  ButtonColor,
  ButtonIcon,
  ButtonText,
} from '#/components/Button'
import {H1} from '#/components/Typography'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRight} from '#/components/icons/ArrowTopRight'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'

export function Buttons() {
  return (
    <View style={[a.gap_md]}>
      <H1>Buttons</H1>

      <View style={[a.flex_row, a.flex_wrap, a.gap_md, a.align_start]}>
        {['primary', 'secondary', 'negative'].map(color => (
          <View key={color} style={[a.gap_md, a.align_start]}>
            {['solid', 'outline', 'ghost'].map(variant => (
              <React.Fragment key={variant}>
                <Button
                  variant={variant as ButtonVariant}
                  color={color as ButtonColor}
                  size="large"
                  label="Click here">
                  Button
                </Button>
                <Button
                  disabled
                  variant={variant as ButtonVariant}
                  color={color as ButtonColor}
                  size="large"
                  label="Click here">
                  Button
                </Button>
              </React.Fragment>
            ))}
          </View>
        ))}

        <View style={[a.flex_row, a.gap_md, a.align_start]}>
          <View style={[a.gap_md, a.align_start]}>
            {['gradient_sky', 'gradient_midnight', 'gradient_sunrise'].map(
              name => (
                <React.Fragment key={name}>
                  <Button
                    variant="gradient"
                    color={name as ButtonColor}
                    size="large"
                    label="Click here">
                    Button
                  </Button>
                  <Button
                    disabled
                    variant="gradient"
                    color={name as ButtonColor}
                    size="large"
                    label="Click here">
                    Button
                  </Button>
                </React.Fragment>
              ),
            )}
          </View>
          <View style={[a.gap_md, a.align_start]}>
            {['gradient_sunset', 'gradient_nordic', 'gradient_bonfire'].map(
              name => (
                <React.Fragment key={name}>
                  <Button
                    variant="gradient"
                    color={name as ButtonColor}
                    size="large"
                    label="Click here">
                    Button
                  </Button>
                  <Button
                    disabled
                    variant="gradient"
                    color={name as ButtonColor}
                    size="large"
                    label="Click here">
                    Button
                  </Button>
                </React.Fragment>
              ),
            )}
          </View>
        </View>

        <Button
          variant="gradient"
          color="gradient_sky"
          size="large"
          label="Link out">
          <ButtonText>Link out</ButtonText>
          <ButtonIcon icon={ArrowTopRight} />
        </Button>

        <Button
          variant="gradient"
          color="gradient_sky"
          size="small"
          label="Link out">
          <ButtonText>Link out</ButtonText>
          <ButtonIcon icon={ArrowTopRight} />
        </Button>

        <Button
          variant="gradient"
          color="gradient_sky"
          size="small"
          label="Link out">
          <ButtonIcon icon={Globe} />
          <ButtonText>See the world</ButtonText>
        </Button>
      </View>
    </View>
  )
}
