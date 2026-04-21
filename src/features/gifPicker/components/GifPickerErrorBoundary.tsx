import {Trans, useLingui} from '@lingui/react/macro'

import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'

export function GifPickerErrorBoundary({details}: {details?: string}) {
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()

  return (
    <Dialog.ScrollableInner style={a.gap_md} label={l`An error has occurred`}>
      <Dialog.Close />
      <ErrorScreen
        title={l`Oh no!`}
        message={l`There was an unexpected issue in the application. Please let us know if this happened to you!`}
        details={details}
      />
      <Button
        label={l`Close dialog`}
        onPress={() => control.close()}
        color="primary"
        size="large">
        <ButtonText>
          <Trans>Close</Trans>
        </ButtonText>
      </Button>
    </Dialog.ScrollableInner>
  )
}
