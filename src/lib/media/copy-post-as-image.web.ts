import {t} from '@lingui/core/macro'
import {toBlob} from 'html-to-image'

import {logger} from '#/logger'
import * as Toast from '#/components/Toast'

export async function copyPostAsImage(
  ref: {current: unknown} | null | undefined,
): Promise<boolean> {
  const element = ref?.current instanceof HTMLElement ? ref.current : null
  const {backgroundColor} = getComputedStyle(document.body)

  if (!element) {
    Toast.show(t`Could not copy image`, {type: 'error'})
    return false
  }

  try {
    const blob = await toBlob(element, {
      backgroundColor: backgroundColor,
      cacheBust: true,
      pixelRatio: window.devicePixelRatio,
    })

    if (!blob) {
      throw new Error('Failed to generate image blob')
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ])

    Toast.show(t`Copied to clipboard`, {type: 'success'})
    return true
  } catch (err) {
    logger.error('Failed to copy post as image', {safeMessage: err})
    Toast.show(t`Could not copy image`, {type: 'error'})
    return false
  }
}
