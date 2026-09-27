import {
  findNodeHandle,
  type GestureResponderEvent,
  type View,
} from 'react-native'

import {type DialogControlOpenOptions} from '#/components/Dialog/types'

/**
 * Keep explicit anchors for programmatic opens, but only infer an anchor from
 * press events when the dialog opts into popover presentation.
 */
export function getDialogSourceViewTag({
  popover,
  nativeSourceViewTag,
  options,
}: {
  popover?: boolean
  nativeSourceViewTag?: number
  options?: DialogControlOpenOptions & Partial<GestureResponderEvent>
}): number | undefined {
  if (nativeSourceViewTag != null) {
    return nativeSourceViewTag
  }

  if (typeof options?.sourceViewTag === 'number') {
    return options.sourceViewTag
  }

  if (!popover) {
    return undefined
  }

  return (
    getNativeViewTag(options?.currentTarget) ??
    getNativeViewTag(options?.target) ??
    getNativeViewTag(options?.nativeEvent?.target)
  )
}

/**
 * UIKit needs a React tag even when Fabric exposes the event target as a host
 * instance. Detached or unsupported targets can fall back to another source.
 */
export function getNativeViewTag(target: unknown): number | undefined {
  if (typeof target === 'number') {
    return Number.isSafeInteger(target) ? target : undefined
  }

  if (typeof target === 'string') {
    const parsed = Number(target)
    return target.trim() !== '' && Number.isSafeInteger(parsed)
      ? parsed
      : undefined
  }

  if (target == null) {
    return undefined
  }

  try {
    const tag = findNodeHandle(target as React.ComponentRef<typeof View>)
    return typeof tag === 'number' ? tag : undefined
  } catch {
    return undefined
  }
}
