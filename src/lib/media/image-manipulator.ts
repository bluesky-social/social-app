import {
  ImageManipulator,
  type ImageManipulatorContext,
  type ImageResult,
  type SaveOptions,
} from 'expo-image-manipulator'

import {IS_WEB} from '#/env'

export async function renderImage(
  source: string,
  manipulate?: (context: ImageManipulatorContext) => void,
  saveOptions?: SaveOptions,
): Promise<ImageResult> {
  const context = ImageManipulator.manipulate(source)

  try {
    manipulate?.(context)
    const image = await context.renderAsync()

    try {
      return await image.saveAsync(saveOptions)
    } finally {
      releaseWebImageResources(image)
      image.release()
    }
  } finally {
    await releaseWebContextResources(context)
    context.release()
  }
}

export function revokeObjectUrl(uri: string | undefined): void {
  if (IS_WEB && uri?.startsWith('blob:')) {
    URL.revokeObjectURL(uri)
  }
}

function releaseWebImageResources(image: unknown): void {
  if (!IS_WEB) {
    return
  }

  const webImage = image as {
    uri?: string
    canvas?: {width: number; height: number}
  }
  revokeObjectUrl(webImage.uri)
  if (webImage.canvas) {
    webImage.canvas.width = 0
    webImage.canvas.height = 0
  }
}

async function releaseWebContextResources(context: unknown): Promise<void> {
  if (!IS_WEB) {
    return
  }

  try {
    const currentTask = (
      context as {
        currentTask?: Promise<{width: number; height: number}>
      }
    ).currentTask
    const canvas = await currentTask
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  } catch {
    // The original render error is more useful than a cleanup error.
  }
}
