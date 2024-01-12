import React from 'react'
import {View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/view/com/Button'
import {Link} from '#/view/com/Link'
import {Text, H3} from '#/view/com/Typography'

export function Buttons() {
  const t = useTheme()

  return (
    <View style={[a.gap_md, a.align_start]}>
      <Button
        accessibilityLabel="Click here"
        accessibilityHint="Opens something">
        Unstyled button
      </Button>

      <Button
        accessibilityLabel="Click here"
        accessibilityHint="Opens something">
        {({state}) => (
          <View style={[a.p_md, a.rounded_full, t.atoms.bg_contrast_300]}>
            <Text>Entirely custom button, state: {JSON.stringify(state)}</Text>
          </View>
        )}
      </Button>

      <Button
        accessibilityLabel="Click here"
        accessibilityHint="Opens something"
        type="primary"
        size="large">
        Default button
      </Button>

      <Button
        accessibilityLabel="Click here"
        accessibilityHint="Opens something"
        type="primary"
        size="large"
        disabled>
        Default button (disabled)
      </Button>

      <Button
        accessibilityLabel="Click here"
        accessibilityHint="Opens something"
        type="primary"
        size="large">
        {({props}) => (
          <>
            <FontAwesomeIcon icon={['fas', 'plus']} size={12} />
            <ButtonText {...props}>Default with an icon</ButtonText>
          </>
        )}
      </Button>

      <Button
        accessibilityLabel="Click here"
        accessibilityHint="Opens something"
        type="secondary"
        size="small">
        Small button
      </Button>

      <Button
        accessibilityLabel="Click here"
        accessibilityHint="Opens something"
        type="secondary"
        size="small"
        disabled>
        Small button (disabled)
      </Button>

      <Link
        accessibilityLabel="Click here"
        accessibilityHint="Opens something"
        to="https://blueskyweb.xyz"
        warnOnMismatchingTextChild
        style={[a.text_md]}>
        External
      </Link>
      <Link
        accessibilityLabel="Click here"
        accessibilityHint="Opens something"
        to="https://blueskyweb.xyz"
        style={[a.text_md]}>
        <H3>External with custom children</H3>
      </Link>
      <Link
        accessibilityLabel="Click here"
        accessibilityHint="Opens something"
        to="https://blueskyweb.xyz"
        warnOnMismatchingTextChild
        style={[a.text_md]}>
        https://blueskyweb.xyz
      </Link>
      <Link
        accessibilityLabel="Click here"
        accessibilityHint="Opens something"
        to="https://bsky.app/profile/bsky.app"
        warnOnMismatchingTextChild
        style={[a.text_md]}>
        Internal
      </Link>

      <Link
        accessibilityLabel="Click here"
        accessibilityHint="Opens something"
        type="primary"
        size="large"
        to="https://bsky.app/profile/bsky.app">
        {({props}) => <ButtonText {...props}>Link as a button</ButtonText>}
      </Link>
    </View>
  )
}
