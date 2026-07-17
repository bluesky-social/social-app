import {copyAsync} from 'expo-file-system/legacy'
import {type BlobRef, type Client, type EncodingString} from '@atproto/lex'

import {safeDeleteAsync} from '#/lib/media/manip'

/**
 * The blob-upload response body: `{blob}`. lex `Client.uploadBlob` returns the
 * full XRPC response, so callers read `res.body.blob` (the parsed blob ref).
 */
type UploadBlobResult = {blob: BlobRef}

/**
 * @param encoding Allows overriding the blob's type. Passed as the lex upload
 * option (NEVER a content-type header - lex-client throws if the encoding is
 * set via headers).
 */
export async function uploadBlob(
  client: Client,
  input: string | Blob,
  encoding?: string,
): Promise<UploadBlobResult> {
  if (typeof input === 'string' && input.startsWith('file:')) {
    const blob = await asBlob(input)
    return uploadBlobResult(client, blob, encoding)
  }

  if (typeof input === 'string' && input.startsWith('/')) {
    const blob = await asBlob(`file://${input}`)
    return uploadBlobResult(client, blob, encoding)
  }

  if (typeof input === 'string' && input.startsWith('data:')) {
    const blob = await fetch(input).then(r => r.blob())
    return uploadBlobResult(client, blob, encoding)
  }

  if (input instanceof Blob) {
    return uploadBlobResult(client, input, encoding)
  }

  throw new TypeError(`Invalid uploadBlob input: ${typeof input}`)
}

async function uploadBlobResult(
  client: Client,
  blob: Blob,
  encoding?: string,
): Promise<UploadBlobResult> {
  /*
   * The lex encoding option is a branded mime string (`${string}/${string}`);
   * callers pass a plain mime string, so assert the brand here.
   */
  const res = await client.uploadBlob(blob, {
    encoding: encoding as EncodingString | undefined,
  })
  return {blob: res.body.blob}
}

async function asBlob(uri: string): Promise<Blob> {
  return withSafeFile(uri, async safeUri => {
    // Note
    // Android does not support `fetch()` on `file://` URIs. for this reason, we
    // use XMLHttpRequest instead of simply calling:

    // return fetch(safeUri.replace('file:///', 'file:/')).then(r => r.blob())

    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.onload = () => resolve(xhr.response)
      xhr.onerror = () => reject(new Error('Failed to load blob'))
      xhr.responseType = 'blob'
      xhr.open('GET', safeUri, true)
      xhr.send(null)
    })
  })
}

// HACK
// React native has a bug that inflates the size of jpegs on upload
// we get around that by renaming the file ext to .bin
// see https://github.com/facebook/react-native/issues/27099
// -prf
async function withSafeFile<T>(
  uri: string,
  fn: (path: string) => Promise<T>,
): Promise<T> {
  if (uri.endsWith('.jpeg') || uri.endsWith('.jpg')) {
    // Since we don't "own" the file, we should avoid renaming or modifying it.
    // Instead, let's copy it to a temporary file and use that (then remove the
    // temporary file).
    const newPath = uri.replace(/\.jpe?g$/, '.bin')
    try {
      await copyAsync({from: uri, to: newPath})
    } catch {
      // Failed to copy the file, just use the original
      return await fn(uri)
    }
    try {
      return await fn(newPath)
    } finally {
      // Remove the temporary file
      await safeDeleteAsync(newPath)
    }
  } else {
    return fn(uri)
  }
}
