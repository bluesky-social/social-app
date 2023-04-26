import {RootStoreModel} from 'state/index'

export async function openAltTextModal(
  store: RootStoreModel,
  prevAltText: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    store.shell.openModal({
      name: 'alt-text-image',
      prevAltText,
      onAltTextSet: (altText?: string) => {
        if (altText) {
          resolve(altText)
        } else {
          reject(new Error('Canceled'))
        }
      },
    })
  })
}
