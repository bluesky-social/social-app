import {Trans, useLingui} from '@lingui/react/macro'

import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'

export function GifPickerErrorBoundary({details}: {details?: string}) {
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()

  return (
    <Dialog.ScrollableInner
      style={a.gap_md}
      label={l({
        message: 'An error has occurred',
        comment:
          'Accessibility label for the dialog shown when the GIF picker hits an unexpected runtime error and falls back to its error boundary.',
      })}>
      <Dialog.Close />
      <ErrorScreen
        title={l({
          message: 'Oh no!',
          comment:
            'Title of the error screen shown when the GIF picker crashes unexpectedly.',
        })}
        message={l({
          message:
            'There was an unexpected issue in the application. Please let us know if this happened to you!',
          comment:
            'Body of the error screen shown when the GIF picker crashes unexpectedly. Encourages the user to report the issue.',
        })}
        details={details}
      />
      <Button
        label={l({
          message: 'Close dialog',
          comment:
            'Accessibility label for the button that dismisses the GIF picker error dialog.',
        })}
        onPress={() => control.close()}
        color="primary"
        size="large">
        <ButtonText>
          <Trans comment="Visible label of the button that dismisses the GIF picker error dialog.">
            Close
          </Trans>
        </ButtonText>
      </Button>
    </Dialog.ScrollableInner>
  )
}
