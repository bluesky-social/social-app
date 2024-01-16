import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Button, ButtonVariant, ButtonColor} from '#/components/Button'
import {H1} from '#/components/Typography'

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
                  accessibilityLabel="Click here"
                  accessibilityHint="Opens something">
                  Button
                </Button>
                <Button
                  disabled
                  variant={variant as ButtonVariant}
                  color={color as ButtonColor}
                  size="large"
                  accessibilityLabel="Click here"
                  accessibilityHint="Opens something">
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
                    accessibilityLabel="Click here"
                    accessibilityHint="Opens something">
                    Button
                  </Button>
                  <Button
                    disabled
                    variant="gradient"
                    color={name as ButtonColor}
                    size="large"
                    accessibilityLabel="Click here"
                    accessibilityHint="Opens something">
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
                    accessibilityLabel="Click here"
                    accessibilityHint="Opens something">
                    Button
                  </Button>
                  <Button
                    disabled
                    variant="gradient"
                    color={name as ButtonColor}
                    size="large"
                    accessibilityLabel="Click here"
                    accessibilityHint="Opens something">
                    Button
                  </Button>
                </React.Fragment>
              ),
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
