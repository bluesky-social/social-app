import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {
  Button,
  ButtonColor,
  ButtonIcon,
  ButtonText,
  ButtonVariant,
} from '#/components/Button'
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft} from '#/components/icons/Chevron'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {H1} from '#/components/Typography'

export function Buttons() {
  return (
    <View style={[a.gap_md]}>
      <H1>Buttons</H1>

      <View style={[a.flex_row, a.flex_wrap, a.gap_md, a.align_start]}>
        {['primary', 'secondary', 'secondary_inverted', 'negative'].map(
          color => (
            <View key={color} style={[a.gap_md, a.align_start]}>
              {['solid', 'outline', 'ghost'].map(variant => (
                <React.Fragment key={variant}>
                  <Button
                    variant={variant as ButtonVariant}
                    color={color as ButtonColor}
                    size="large"
                    label="Click here">
                    <ButtonText>Button</ButtonText>
                  </Button>
                  <Button
                    disabled
                    variant={variant as ButtonVariant}
                    color={color as ButtonColor}
                    size="large"
                    label="Click here">
                    <ButtonText>Button</ButtonText>
                  </Button>
                </React.Fragment>
              ))}
            </View>
          ),
        )}

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
                    <ButtonText>Button</ButtonText>
                  </Button>
                  <Button
                    disabled
                    variant="gradient"
                    color={name as ButtonColor}
                    size="large"
                    label="Click here">
                    <ButtonText>Button</ButtonText>
                  </Button>
                </React.Fragment>
              ),
            )}
          </View>
        </View>
      </View>

      <View style={[a.flex_wrap, a.gap_md, a.align_start]}>
        <Button variant="solid" color="primary" size="large" label="Link out">
          <ButtonText>Button</ButtonText>
        </Button>
        <Button variant="solid" color="primary" size="large" label="Link out">
          <ButtonText>Button</ButtonText>
          <ButtonIcon icon={Globe} position="right" />
        </Button>

        <Button variant="solid" color="primary" size="small" label="Link out">
          <ButtonText>Button</ButtonText>
        </Button>
        <Button variant="solid" color="primary" size="small" label="Link out">
          <ButtonText>Button</ButtonText>
          <ButtonIcon icon={Globe} position="right" />
        </Button>

        <Button variant="solid" color="primary" size="tiny" label="Link out">
          <ButtonIcon icon={Globe} position="left" />
          <ButtonText>Button</ButtonText>
        </Button>
      </View>

      <View style={[a.flex_row, a.gap_md, a.align_center]}>
        <Button variant="solid" color="primary" size="large" label="Link out">
          <ButtonText>Button</ButtonText>
        </Button>
        <Button variant="solid" color="primary" size="large" label="Link out">
          <ButtonText>Button</ButtonText>
          <ButtonIcon icon={Globe} position="right" />
        </Button>
        <Button variant="solid" color="primary" size="large" label="Link out">
          <ButtonText>Button</ButtonText>
          <ButtonIcon icon={Globe} position="right" size="lg" />
        </Button>
        <Button
          variant="solid"
          color="primary"
          size="large"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="solid"
          color="primary"
          size="large"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} size="lg" />
        </Button>
      </View>

      <View style={[a.flex_row, a.gap_md, a.align_center]}>
        <Button variant="solid" color="primary" size="small" label="Link out">
          <ButtonText>Button</ButtonText>
        </Button>
        <Button variant="solid" color="primary" size="small" label="Link out">
          <ButtonText>Button</ButtonText>
          <ButtonIcon icon={Globe} position="right" />
        </Button>
        <Button
          variant="solid"
          color="primary"
          size="small"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="solid"
          color="primary"
          size="small"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} size="lg" />
        </Button>
      </View>

      <View style={[a.flex_row, a.gap_md, a.align_center]}>
        <Button variant="solid" color="primary" size="tiny" label="Link out">
          <ButtonText>Button</ButtonText>
        </Button>
        <Button variant="solid" color="primary" size="tiny" label="Link out">
          <ButtonText>Button</ButtonText>
          <ButtonIcon icon={Globe} position="right" />
        </Button>
        <Button
          variant="solid"
          color="primary"
          size="tiny"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="solid"
          color="primary"
          size="tiny"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} size="md" />
        </Button>
      </View>

      <View style={[a.flex_row, a.gap_md, a.align_center]}>
        <Button
          variant="solid"
          color="primary"
          size="large"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="gradient"
          color="gradient_sunset"
          size="small"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="gradient"
          color="gradient_sunset"
          size="tiny"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="outline"
          color="primary"
          size="large"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="ghost"
          color="primary"
          size="small"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="ghost"
          color="primary"
          size="tiny"
          shape="round"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
      </View>

      <View style={[a.flex_row, a.gap_md, a.align_start]}>
        <Button
          variant="solid"
          color="primary"
          size="large"
          shape="square"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="gradient"
          color="gradient_sunset"
          size="small"
          shape="square"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="gradient"
          color="gradient_sunset"
          size="tiny"
          shape="square"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="outline"
          color="primary"
          size="large"
          shape="square"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="ghost"
          color="primary"
          size="small"
          shape="square"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          variant="ghost"
          color="primary"
          size="tiny"
          shape="square"
          label="Link out">
          <ButtonIcon icon={ChevronLeft} />
        </Button>
      </View>
    </View>
  )
}
