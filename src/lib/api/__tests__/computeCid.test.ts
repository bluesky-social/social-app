/*
 * The jest suite ships global manual mocks for `multiformats/cid` and
 * `multiformats/hashes/hasher` (in root `__mocks__/`) so unrelated tests don't
 * pull in real crypto. This test is precisely about the real CID hashing, so we
 * opt back into the actual implementations here.
 */
jest.unmock('multiformats/cid')
jest.unmock('multiformats/hashes/hasher')

import {BlobRef} from '@atproto/api'
import {CID} from 'multiformats/cid'

import {computeCid} from '#/lib/api/computeCid'
import {type app, type com} from '#/lexicons'

/*
 * Golden-CID regression test for the composer post pipeline (design section F).
 *
 * `computeCid` hashes a post record in the client so a thread's later posts can
 * reference earlier posts by CID before the server assigns them. The hash is
 * byte-sensitive: any drift in how records (especially blobs) are serialized to
 * DAG-CBOR silently produces the wrong CID and breaks reply chains with NO type
 * error. These golden values were captured from the PRE-migration `computeCid`
 * (the `instanceof BlobRef` path) and MUST remain byte-identical after the guard
 * is changed to the structural `isBlobRef` shape check.
 *
 * The blob CID below is a fixed, deterministic CIDv1/raw/sha256 used purely as a
 * stable fixture - it is not derived from any real upload.
 */
const BLOB_CID = 'bafkreieq5jui4j25lacwomsqgjeswwl3y5zcdrresptwgmfylxo2depppq'

/**
 * Build a post record with an image embed whose blob is the given value. Used to
 * prove that a `@atproto/api` `BlobRef` class instance (the shape the not-yet
 * -migrated video path still yields) and a plain-JSON lex blob (the shape lex
 * `uploadBlob` returns) hash to the SAME CID.
 */
function postWithImageBlob(blob: unknown): app.bsky.feed.post.Main {
  return {
    $type: 'app.bsky.feed.post',
    createdAt: '2024-01-01T00:00:00.001Z',
    text: 'post with image',
    embed: {
      $type: 'app.bsky.embed.images',
      images: [
        {
          image: blob,
          alt: 'alt text',
          aspectRatio: {width: 100, height: 200},
        },
      ],
    },
  } as app.bsky.feed.post.Main
}

describe('computeCid', () => {
  it('case 1: plain post record with no blob', async () => {
    const record: app.bsky.feed.post.Main = {
      $type: 'app.bsky.feed.post',
      createdAt: '2024-01-01T00:00:00.000Z',
      text: 'hello world',
    }
    expect(await computeCid(record)).toBe(
      'bafyreieawtmh7hwfrqpamqkodza5r62bbfhsepe2iyustgxhgbhi6b2lfi',
    )
  })

  it('case 2: record whose embed carries a BlobRef class instance', async () => {
    const blob = new BlobRef(CID.parse(BLOB_CID), 'image/jpeg', 12345)
    expect(await computeCid(postWithImageBlob(blob))).toBe(
      'bafyreiem7g6vja66nebr7he4fshfnlyndyldbvle2n265oixscmepjcbii',
    )
  })

  it('case 2b: a plain-JSON blob object hashes identically to the class instance', async () => {
    /*
     * This is the post-migration shape: lex `uploadBlob` returns a plain object
     * `{$type: 'blob', ref, mimeType, size}` (with `ref` a parsed CID), not a
     * `BlobRef` class instance. The structural `isBlobRef` guard must treat it
     * exactly like the class instance so the CID is unchanged. Under the
     * pre-change `instanceof` code this case already matches because the plain
     * object walks through `prepareForHashing` unchanged and DAG-CBOR encodes
     * its CID `ref` the same way `.ipld()` does.
     */
    const blob = {
      $type: 'blob' as const,
      ref: CID.parse(BLOB_CID),
      mimeType: 'image/jpeg',
      size: 12345,
    }
    expect(await computeCid(postWithImageBlob(blob))).toBe(
      'bafyreiem7g6vja66nebr7he4fshfnlyndyldbvle2n265oixscmepjcbii',
    )
  })

  it('case 3: three-post thread chains reply StrongRef CIDs', async () => {
    const did = 'did:plc:abc123'
    const base = new Date('2024-01-01T00:00:00.000Z')
    const golden = [
      'bafyreig62rxs34h5rvznfrracwkjlfgad5b25qxglp2hcziqdfas2nw2ee',
      'bafyreicxcj2tq5jrh5jcaczg3eli5cvxitgzu7kpu3fm5v3njq2byjxirq',
      'bafyreigvaswuhlpd7dllja2xrqswhqbruyv2kar7mvbn7gdm5ldzu6vkti',
    ]

    let reply: app.bsky.feed.post.Main['reply'] | undefined
    for (let i = 0; i < 3; i++) {
      const now = new Date(base.getTime() + i)
      const uri = `at://${did}/app.bsky.feed.post/rkey${i}`
      const record = {
        $type: 'app.bsky.feed.post',
        createdAt: now.toISOString(),
        text: `post ${i}`,
        reply,
      } as app.bsky.feed.post.Main
      const cid = await computeCid(record)
      expect(cid).toBe(golden[i])
      const ref = {cid, uri} as com.atproto.repo.strongRef.Main
      reply = {root: reply?.root ?? ref, parent: ref}
    }
  })
})
