import {RootStoreModel} from 'state/index'

export async function openAltTextModal(store: RootStoreModel): Promise<string> {
  return new Promise((resolve, reject) => {
    store.shell.openModal({
      name: 'alt-text-image',
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
