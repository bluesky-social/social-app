import {
  ImageManipulator,
  type ImageManipulatorContext,
  type ImageResult,
  type SaveOptions,
} from 'expo-image-manipulator'

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
      image.release()
    }
  } finally {
    context.release()
  }
}
