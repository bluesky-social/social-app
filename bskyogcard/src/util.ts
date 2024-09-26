import twemoji from 'twemoji'

import {renderLogger} from './logger.js'

const U200D = String.fromCharCode(0x200d)
const UFE0F_REGEXP = /\uFE0F/g

export async function loadEmojiAsSvg(chars: string) {
  const cached = emojiCache.get(chars)
  if (cached) return cached
  const iconCode = twemoji.convert.toCodePoint(
    chars.indexOf(U200D) < 0 ? chars.replace(UFE0F_REGEXP, '') : chars,
  )
  const res = await fetch(getEmojiUrl(iconCode))
  const body = await res.arrayBuffer()
  if (!res.ok) {
    renderLogger.warn(
      {status: res.status, err: Buffer.from(body).toString()},
      'could not fetch emoji',
    )
    return
  }
  const svg =
    'data:image/svg+xml;base64,' + Buffer.from(body).toString('base64')
  emojiCache.set(chars, svg)
  return svg
}

const emojiCache = new Map<string, string>()

function getEmojiUrl(code: string) {
  return (
    'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/' +
    code.toLowerCase() +
    '.svg'
  )
}
