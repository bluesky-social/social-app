import {BskyAgent, ComAtprotoRepoUploadBlob} from '@atproto/api'

/**
 * @note It is recommended, on web, to use the `file` instance of the file
 * selector input element, rather than a `data:` URL, to avoid
 * loading the file into memory. `File` extends `Blob` "file" instances can
 * be passed directly to this function.
 */
export async function uploadBlob(
  agent: BskyAgent,
  input: string | Blob,
  encoding?: string,
): Promise<ComAtprotoRepoUploadBlob.Response> {
  if (
    typeof input === 'string' &&
    (input.startsWith('data:') || input.startsWith('blob:'))
  ) {
    const blob = await fetch(input).then(r => r.blob())
    return agent.uploadBlob(blob, {encoding})
  }

  if (input instanceof Blob) {
    return agent.uploadBlob(input, {
      encoding,
    })
  }

  throw new TypeError(`Invalid uploadBlob input: ${typeof input}`)
}
