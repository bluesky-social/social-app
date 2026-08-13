import {BlobRef} from '@atproto/api'
import {type BlobRef as LexBlobRef} from '@atproto/lex'

/**
 * Bridge a lex blob ref (the plain-JSON `{$type: 'blob', ref, mimeType, size}`
 * that {@link uploadBlob} now returns) back to the legacy `BlobRef` class
 * instance.
 *
 * Only needed where a blob is handed to a legacy agent write: the legacy
 * lexicon blob validator checks `value instanceof BlobRef`, so a plain lex
 * blob fails validation, and the legacy serializer would put the wrong shape
 * on the wire. Drop each call as its write moves to the lex client.
 */
export function toLegacyBlobRef(blob: LexBlobRef): BlobRef {
  return BlobRef.fromJsonRef(blob as Parameters<typeof BlobRef.fromJsonRef>[0])
}
