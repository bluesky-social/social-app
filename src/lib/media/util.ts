export function extractDataUriMime(uri: string): string {
  return uri.substring(uri.indexOf(':') + 1, uri.indexOf(';'))
}

export function getDataUriSize(uri: string): number {
  return Math.round((uri.length * 3) / 4) // very rough estimate
}

// TODO: Can we consolidate this with an existing type?
interface ImageInfo {
  uri: string
  width: number
  height: number
}

/**
 * Given a File instance (like one pulled from a paste event), return
 * a data URI and the image dimensions for the pasted file. Returns
 * width 0, height 0 for non-images
 */
export function getImageInfoFromFile(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => {
      const maybeUri = reader.result

      // reader.result can be different data types depending on what
      // readAs... method is called. We're using readAsDataUrl which
      // will read as a string. If someone were to change that
      // accidentally or otherwise, then reader.result might not be
      // a string. In which case, we'll bail out and yell at the dev.
      if (typeof maybeUri === 'string') {
        const uri = maybeUri

        // Non-images proooobably shouldn't even be accepted in this function
        // TODO: Maybe just reject for non-images?
        if (!file.type.startsWith('image/')) {
          return resolve({
            uri,
            width: 0,
            height: 0,
          })
        }

        // Get the dimensions of said file
        const img = new Image()
        img.src = uri
        img.onload = () => {
          return resolve({
            uri,
            width: img.width,
            height: img.height,
          })
        }

        return
      }

      reject(
        new Error(
          'File was not called with .readAsDataURL(...). ' +
            'This absolutely should not happen. Make sure ' +
            'the reader instance is calling .readAsDataURL() ' +
            'on the file',
        ),
      )
    }

    reader.onerror = reject
    reader.onabort = () => reject(new Error('File read aborted'))
  })
}
