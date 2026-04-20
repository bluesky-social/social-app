import {fetch as nativeFetch} from 'react-native-nitro-fetch'
import {TextDecoder as NitroTextDecoder} from 'react-native-nitro-text-decoder'

const utf8Decoder = new NitroTextDecoder()

function withReliableArrayBuffer(res: Response): Response {
  const readArrayBuffer = res.arrayBuffer.bind(res)
  const readText = res.text.bind(res)

  res.arrayBuffer = async () => {
    const buf = await readArrayBuffer()
    if (buf.byteLength > 0) return buf
    const text = await readText()
    return text ? new TextEncoder().encode(text).buffer : new ArrayBuffer(0)
  }

  return res
}

function normalizeInitBody(
  init: RequestInit | undefined,
): RequestInit | undefined {
  if (init?.body == null) return init

  const {body} = init
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    return {...init, body: utf8Decoder.decode(body)}
  }
  return init
}

export const fetch: typeof globalThis.fetch = async (input, init) => {
  const normalizedInit = normalizeInitBody(init)
  const res = await nativeFetch(input as RequestInfo, normalizedInit)
  return withReliableArrayBuffer(res)
}
