import {device, useStorage} from '#/storage'

/**
 * Developer toggle (About settings, in dev mode) that turns off the
 * VirtualizedList interior spacer patch (`measureInteriorSpacers`) on the
 * anchored Home Following list, so the patch can be compared on and off on
 * device. Unset means the patch is on. Reactive, so it applies at the list's
 * next render.
 */
export function useSpacerPatchDisabled() {
  const [disabled = false, setDisabled] = useStorage(device, [
    'followingV2SpacerPatchDisabled',
  ])
  return [disabled, setDisabled] as const
}
