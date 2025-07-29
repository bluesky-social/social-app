import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {H1} from '#/components/Typography'
import * as Toast from '#/view/com/util/Toast'
import * as ToastHelpers from '#/view/com/util/ToastHelpers'

export function Toasts() {
  return (
    <View style={[a.gap_md]}>
      <H1>Toasts</H1>

      <View style={[a.gap_sm]}>
        <Button
          variant="solid"
          color="primary"
          size="small"
          label="Show success toast"
          onPress={() =>
            Toast.show('Operation completed successfully!', 'success')
          }>
          <ButtonText>Success!</ButtonText>
        </Button>

        <Button
          variant="solid"
          color="negative"
          size="small"
          label="Show error toast"
          onPress={() => Toast.show('Something went wrong!', 'error')}>
          <ButtonText>Error</ButtonText>
        </Button>

        <Button
          variant="solid"
          color="secondary"
          size="small"
          label="Show warning toast"
          onPress={() => Toast.show('Please check your input', 'warning')}>
          <ButtonText>Warning</ButtonText>
        </Button>

        <Button
          variant="solid"
          color="secondary"
          size="small"
          label="Show info toast"
          onPress={() => Toast.show("Here's some helpful information", 'info')}>
          <ButtonText>Info </ButtonText>
        </Button>

        <Button
          variant="outline"
          color="secondary"
          size="small"
          label="Show toast with long message"
          onPress={() =>
            Toast.show(
              'This is a longer message to test how the toast handles multiple lines of text content.',
              'info',
            )
          }>
          <ButtonText>Long Message </ButtonText>
        </Button>
      </View>
    </View>
  )
}
