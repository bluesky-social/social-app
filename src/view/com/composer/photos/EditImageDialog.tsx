import React from 'react'

import {ComposerImage} from '#/state/gallery'
import * as Dialog from '#/components/Dialog'

export type EditImageDialogProps = {
  control: Dialog.DialogOuterProps['control']
  image: ComposerImage
  onChange: (next: ComposerImage) => void
}

export const EditImageDialog = ({}: EditImageDialogProps): React.ReactNode => {
  return null
}
