import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'

export function GifPickerErrorBoundary({details}: {details?: string}) {
  const {_} = useLingui()
  const control = Dialog.useDialogContext()

  return (
    <Dialog.ScrollableInner
      style={a.gap_md}
      label={_(msg`An error has occurred`)}>
      <Dialog.Close />
      <ErrorScreen
        title={_(msg`Oh no!`)}
        message={_(
          msg`There was an unexpected issue in the application. Please let us know if this happened to you!`,
        )}
        details={details}
      />
      <Button
        label={_(msg`Close dialog`)}
        onPress={() => control.close()}
        color="primary"
        size="large"
        variant="solid">
        <ButtonText>
          <Trans>Close</Trans>
        </ButtonText>
      </Button>
    </Dialog.ScrollableInner>
  )
}
