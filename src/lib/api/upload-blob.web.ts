import {type BlobRef, type Client, type EncodingString} from '@atproto/lex'

/**
 * The blob-upload response body: `{blob}`. lex `Client.uploadBlob` returns the
 * full XRPC response, so callers read `res.body.blob` (the parsed blob ref).
 */
type UploadBlobResult = {blob: BlobRef}

/**
 * @note It is recommended, on web, to use the `file` instance of the file
 * selector input element, rather than a `data:` URL, to avoid
 * loading the file into memory. `File` extends `Blob` "file" instances can
 * be passed directly to this function.
 *
 * @param encoding Passed as the lex upload option (NEVER a content-type header
 * - lex-client throws if the encoding is set via headers).
 */
export async function uploadBlob(
  client: Client,
  input: string | Blob,
  encoding?: string,
): Promise<UploadBlobResult> {
  /*
   * The lex encoding option is a branded mime string (`${string}/${string}`);
   * callers pass a plain mime string, so assert the brand here.
   */
  const enc = encoding as EncodingString | undefined
  if (
    typeof input === 'string' &&
    (input.startsWith('data:') || input.startsWith('blob:'))
  ) {
    const blob = await fetch(input).then(r => r.blob())
    const res = await client.uploadBlob(blob, {encoding: enc})
    return {blob: res.body.blob}
  }

  if (input instanceof Blob) {
    const res = await client.uploadBlob(input, {encoding: enc})
    return {blob: res.body.blob}
  }

  throw new TypeError(`Invalid uploadBlob input: ${typeof input}`)
}
