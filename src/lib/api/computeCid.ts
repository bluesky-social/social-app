import {sha256} from 'js-sha256'
import {CID} from 'multiformats/cid'
import * as Hasher from 'multiformats/hashes/hasher'

import {app} from '#/lexicons'

/*
 * Client-side CID computation for post records, extracted from the post
 * pipeline so it can be unit-tested in isolation (importing the pipeline pulls
 * in the native gallery/media chain). See `computeCid.test.ts` for the golden
 * -CID regression fixtures that gate any change to this serialization.
 */

// The built-in hashing functions from multiformats (`multiformats/hashes/sha2`)
// are meant for Node.js, this is the cross-platform equivalent.
const mf_sha256 = Hasher.from({
  name: 'sha2-256',
  code: 0x12,
  encode: input => {
    const digest = sha256.arrayBuffer(input)
    return new Uint8Array(digest)
  },
})

export async function computeCid(
  record: app.bsky.feed.post.Main,
): Promise<string> {
  /*
   * Lazily loaded since it's only needed when posting a thread, and its
   * `cborg` dependency is ~190KB that would otherwise be in the initial
   * web bundle.
   */
  const dcbor = await importDagCbor()
  // IMPORTANT: `prepareObject` prepares the record to be hashed by removing
  // fields with undefined value, and converting BlobRef instances to the
  // right IPLD representation.
  const prepared = prepareForHashing(record)
  // 1. Encode the record into DAG-CBOR format
  const encoded = dcbor.encode(prepared)
  // 2. Hash the record in SHA-256 (code 0x12)
  const digest = await mf_sha256.digest(encoded)
  // 3. Create a CIDv1, specifying DAG-CBOR as content (code 0x71)
  const cid = CID.createV1(0x71, digest)
  // 4. Get the Base32 representation of the CID (`b` prefix)
  return cid.toString()
}

/**
 * True for a plain-JSON lexicon blob, the shape lex `uploadBlob` now returns
 * (`{$type: 'blob', ref, mimeType, size}` with `ref` a parsed CID). Replaces
 * the old `instanceof BlobRef` check, since lex blobs are plain objects, not
 * class instances (design section F).
 */
function isBlobRef(v: unknown): boolean {
  if (v == null || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return o.$type === 'blob' && 'ref' in o && 'mimeType' in o
}

/**
 * True for a legacy `@atproto/api` `BlobRef` class instance. During the
 * migration the video embed path still yields these (its blob comes from the
 * not-yet-migrated `app.bsky.video.getJobStatus` bridge call), so we must keep
 * handling them here even though the composer's own uploads are now plain lex
 * blobs. A class instance is duck-typed by its `ipld()` method plus the
 * `ref`/`mimeType` fields; it has NO `$type` and a non-plain prototype, so it
 * would otherwise slip past both `isBlobRef` and `isPlainObject` and be encoded
 * wrong - silently breaking video reply-chain CIDs.
 */
function isBlobRefInstance(
  v: unknown,
): v is {ipld: () => unknown; ref: unknown; mimeType: unknown} {
  if (v == null || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return typeof o.ipld === 'function' && 'ref' in o && 'mimeType' in o
}

// Returns a transformed version of the object for use in DAG-CBOR.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function prepareForHashing(v: any): any {
  /*
   * A plain-JSON lex blob is already in the right IPLD shape (its `ref` is a
   * parsed CID that DAG-CBOR encodes as a CID link), so pass it through
   * untouched.
   */
  if (isBlobRef(v)) {
    return v
  }

  /*
   * A legacy `BlobRef` class instance must be converted via `ipld()` to the
   * plain `{$type, ref, mimeType, size}` object; encoding the instance directly
   * would emit its internal `original` field and omit `$type`, producing the
   * wrong CID. `ipld()` returns exactly what `isBlobRef` accepts above.
   */
  if (isBlobRefInstance(v)) {
    return v.ipld()
  }

  // Walk through arrays
  if (Array.isArray(v)) {
    let pure = true
    const mapped = v.map(value => {
      if (value !== (value = prepareForHashing(value))) {
        pure = false
      }
      return value
    })
    return pure ? v : mapped
  }

  // Walk through plain objects
  if (isPlainObject(v)) {
    const rec = v as Record<string, unknown>
    const obj: Record<string, unknown> = {}
    let pure = true
    for (const key in rec) {
      let value = rec[key]
      // `value` is undefined
      if (value === undefined) {
        pure = false
        continue
      }
      // `prepareObject` returned a value that's different from what we had before
      if (value !== (value = prepareForHashing(value))) {
        pure = false
      }
      obj[key] = value
    }
    // Return as is if we haven't needed to tamper with anything
    return pure ? v : obj
  }
  return v
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPlainObject(v: any): boolean {
  if (typeof v !== 'object' || v === null) {
    return false
  }
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

/**
 * Load `@ipld/dag-cbor` on demand. The dynamic `import()` lets web bundlers
 * emit it (and its ~190KB `cborg` dependency) as a separate chunk that only
 * loads when posting a thread. Under jest (which runs without
 * `--experimental-vm-modules`) dynamic import throws, so we fall back to a
 * lazy `require`, which resolves through the test moduleNameMapper.
 */
function importDagCbor(): Promise<typeof import('@ipld/dag-cbor')> {
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return Promise.resolve(require('@ipld/dag-cbor'))
  }
  return import('@ipld/dag-cbor')
}
