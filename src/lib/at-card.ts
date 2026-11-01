import {isValidDid} from '@atproto/syntax'

import {type app} from '#/lexicons'

/**
 * Optional application extension on an external embed's record. AppView returns
 * the original post record even before this field is standardized in the
 * external embed lexicon. This is a publisher-supplied attribution claim, not
 * proof of ownership. Never infer it from the person sharing the link.
 */
export function withCreator(
  external: app.bsky.embed.external.External,
  creator: string | undefined,
): app.bsky.embed.external.External & {creator?: string} {
  return isValidDid(creator) ? {...external, creator} : external
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Read attribution only from the record's matching external media. */
export function getEmbedCreator(
  record: unknown,
  uri: string,
): string | undefined {
  if (!isObject(record)) return
  let embed = record.embed
  if (!isObject(embed)) return
  if (embed.$type === 'app.bsky.embed.recordWithMedia') embed = embed.media
  if (!isObject(embed) || embed.$type !== 'app.bsky.embed.external') return
  const external = embed.external
  if (!isObject(external) || external.uri !== uri) return
  return isValidDid(external.creator) ? external.creator : undefined
}
