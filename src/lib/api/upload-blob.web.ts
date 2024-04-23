import {BskyAgent, ComAtprotoRepoUploadBlob} from '@atproto/api'

export async function uploadBlob(
  agent: BskyAgent,
  input: string | Blob,
  encoding?: string,
): Promise<ComAtprotoRepoUploadBlob.Response> {
  if (typeof input === 'string' && input.startsWith('data:')) {
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
