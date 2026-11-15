import {type ComposerImage} from '#/state/gallery'

export type OpenCameraBtnProps = {
  disabled?: boolean
  onAdd: (next: ComposerImage[]) => void
}
