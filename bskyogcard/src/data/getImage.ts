import MIMEType from 'whatwg-mimetype'

export async function getImage(url: string) {
  const response = await fetch(url)
  const mimeType = new MIMEType(response.headers.get('content-type') ?? '')
  const arrayBuf = await response.arrayBuffer() // must drain body even if it will be discarded
  if (response.status !== 200) return null
  return {
    mime: mimeType.essence as string | undefined,
    image: Buffer.from(arrayBuf),
  }
}
