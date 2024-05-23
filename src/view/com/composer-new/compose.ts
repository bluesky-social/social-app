// Wasn't sure where to place this file exactly, so I'm keeping it here for now.

import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyFeedPost,
  AppBskyFeedThreadgate,
  AppBskyRichtextFacet,
  AtUri,
  BlobRef,
  BskyAgent,
  ComAtprotoLabelDefs,
  ComAtprotoRepoApplyWrites,
  ComAtprotoRepoStrongRef,
} from '@atproto/api'
import {TID} from '@atproto/common-web'
import * as dcbor from '@ipld/dag-cbor'
import {MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/macro'
import {QueryClient} from '@tanstack/react-query'
import {CID} from 'multiformats/cid'
import * as Hasher from 'multiformats/hashes/hasher'

import {uploadBlob} from '#/lib/api'
import {shortenLinks} from '#/lib/strings/rich-text-manip'
import {compressImage} from '#/state/gallery'
import {LinkMetaReturn, RQKEY as Link_RQKEY} from '#/state/queries/link-meta'
import {RecordReturn, RQKEY as Record_RQKEY} from '#/state/queries/record-meta'
import {
  ComposerState,
  getEmbedLabels,
  getGifUrl,
  PostEmbed,
  PostExternalEmbed,
  PostGifEmbed,
  PostImageEmbed,
  PostRecordEmbed,
} from './state'

// The built-in hashing functions from multiformats (`multiformats/hashes/sha2`)
// are meant for Node.js, this is the Web Crypto API equivalent.
const mf_sha256 = Hasher.from({
  name: 'sha2-256',
  code: 0x12,
  encode: async input => {
    const digest = await crypto.subtle.digest('sha-256', input)
    return new Uint8Array(digest)
  },
})

export interface PostOptions {
  agent: BskyAgent
  queryClient: QueryClient
  state: ComposerState
  onLog?: (message: MessageDescriptor) => void
}

export async function publish({agent, queryClient, state, onLog}: PostOptions) {
  onLog?.(msg`Processing`)

  const did = agent.session!.did

  const now = new Date()
  const writes: ComAtprotoRepoApplyWrites.Create[] = []

  let reply: AppBskyFeedPost.ReplyRef | undefined
  let tid: TID | undefined

  if (state.reply) {
    const replyToUrip = new AtUri(state.reply.uri)

    const parentPost = await agent.getPost({
      repo: replyToUrip.host,
      rkey: replyToUrip.rkey,
    })

    if (parentPost) {
      const parentRef = {
        uri: parentPost.uri,
        cid: parentPost.cid,
      }
      reply = {
        root: parentPost.value.reply?.root || parentRef,
        parent: parentRef,
      }
    }
  }

  for (let idx = 0, len = state.posts.length; idx < len; idx++) {
    // The sorting behavior for multiple posts sharing the same createdAt time is
    // undefined, so what we'll do here is increment the time by 1 for every post
    now.setMilliseconds(idx)

    // Get the record key for this post
    tid = TID.next(tid)

    const rkey = tid.toString()
    const post = state.posts[idx]

    const uri = `at://${did}/app.bsky.feed.post/${rkey}`

    // Resolve richtext, and do modifications
    let rt = post.richtext.clone()

    await rt.detectFacets(agent)
    rt = shortenLinks(rt)

    // filter out any mention facets that didn't map to a user
    rt.facets = rt.facets?.filter(facet => {
      const mention = facet.features.find(feature =>
        AppBskyRichtextFacet.isMention(feature),
      )
      if (mention && !mention.did) {
        return false
      }
      return true
    })

    // Resolve embeds
    let embed: AppBskyFeedPost.Record['embed']
    if (post.embed) {
      embed = await resolveEmbed(post.embed)
    }

    // Get the self-labels
    const labels = getEmbedLabels(post.embed)
    let selfLabels: ComAtprotoLabelDefs.SelfLabels | undefined

    if (labels?.length) {
      selfLabels = {
        $type: 'com.atproto.label.defs#selfLabels',
        values: labels.map(val => ({val})),
      }
    }

    // Now form the record
    const postRecord: AppBskyFeedPost.Record = {
      // IMPORTANT: $type has to exist, CID is calculated with the `$type` field
      // present and will produce the wrong CID if you omit it.
      // `createRecord` and `applyWrites` currently lets you omit this and it'll
      // add it for you, but we want to avoid that here.
      $type: 'app.bsky.feed.post',
      createdAt: now.toISOString(),
      text: rt.text,
      facets: rt.facets,
      reply: reply,
      embed: embed,
      langs: post.languages,
      labels: selfLabels,
    }

    writes.push({
      $type: 'com.atproto.repo.applyWrites#create',
      collection: 'app.bsky.feed.post',
      rkey: rkey,
      value: postRecord,
    })

    // If this is the first post, and we have a threadgate set, create one now.
    if (idx === 0 && state.threadgates?.length) {
      const threadgate = state.threadgates

      let allow: (
        | AppBskyFeedThreadgate.MentionRule
        | AppBskyFeedThreadgate.FollowingRule
        | AppBskyFeedThreadgate.ListRule
      )[] = []

      if (!threadgate.find(v => v.type === 'nobody')) {
        for (const rule of threadgate) {
          if (rule.type === 'mention') {
            allow.push({$type: 'app.bsky.feed.threadgate#mentionRule'})
          } else if (rule.type === 'following') {
            allow.push({$type: 'app.bsky.feed.threadgate#followingRule'})
          } else if (rule.type === 'list') {
            allow.push({
              $type: 'app.bsky.feed.threadgate#listRule',
              list: rule.list,
            })
          }
        }
      }

      const threadgateRecord: AppBskyFeedThreadgate.Record = {
        $type: 'app.bsky.feed.threadgate',
        createdAt: now.toISOString(),
        post: uri,
        allow: allow,
      }

      writes.push({
        $type: 'com.atproto.repo.applyWrites#create',
        collection: 'app.bsky.feed.threadgate',
        rkey: rkey,
        value: threadgateRecord,
      })
    }

    // Retrieve the next reply ref
    if (idx !== len - 1) {
      // IMPORTANT: `prepareObject` prepares the record to be hashed by removing
      // fields with undefined value, and converting BlobRef instances to the
      // right IPLD representation.
      const prepared = prepareObject(postRecord)

      // 1. Encode the record into DAG-CBOR format
      const encoded = dcbor.encode(prepared)

      // 2. Hash the record in SHA-256 (code 0x12)
      const digest = await mf_sha256.digest(encoded)

      // 3. Create a CIDv1, specifying DAG-CBOR as content (code 0x71)
      const cid = CID.createV1(0x71, digest)

      // 4. Get the Base32 representation of the CID (`b` prefix)
      const b32 = cid.toString()

      const ref: ComAtprotoRepoStrongRef.Main = {
        cid: b32,
        uri: `at://${did}/app.bsky.feed.post/${rkey}`,
      }

      reply = {
        root: reply ? reply.root : ref,
        parent: ref,
      }
    }
  }

  onLog?.(msg`Posting`)

  await agent.com.atproto.repo.applyWrites({
    repo: did,
    writes: writes,
  })

  return writes

  async function resolveEmbed(
    root: PostEmbed,
  ): Promise<AppBskyFeedPost.Record['embed']> {
    async function resolveMediaEmbed(
      embed: PostExternalEmbed | PostGifEmbed | PostImageEmbed,
    ): Promise<AppBskyEmbedExternal.Main | AppBskyEmbedImages.Main> {
      if (embed.type === 'external') {
        const {meta, thumb} = await queryClient.fetchQuery<LinkMetaReturn>({
          queryKey: Link_RQKEY(embed.uri),
        })

        let blob: BlobRef | undefined
        if (thumb) {
          onLog?.(msg`Uploading link thumbnail`)

          const {path, mime} = thumb.source
          const response = await uploadBlob(agent, path, mime)

          blob = response.data.blob
        }

        return {
          $type: 'app.bsky.embed.external',
          external: {
            uri: meta.url,
            title: meta.title || '',
            description: meta.description || '',
            thumb: blob,
          },
        }
      }

      if (embed.type === 'gif') {
        const {meta, thumb} = await queryClient.fetchQuery<LinkMetaReturn>({
          queryKey: Link_RQKEY(getGifUrl(embed.gif)),
        })

        let blob: BlobRef | undefined
        if (thumb) {
          onLog?.(msg`Uploading GIF thumbnail`)

          const {path, mime} = thumb.source
          const response = await uploadBlob(agent, path, mime)

          blob = response.data.blob
        }

        return {
          $type: 'app.bsky.embed.external',
          external: {
            uri: meta.url,
            title: embed.gif.content_description,
            description: embed.alt ?? embed.gif.content_description,
            thumb: blob,
          },
        }
      }

      if (embed.type === 'image') {
        onLog?.(msg`Uploading image`)

        const images: AppBskyEmbedImages.Image[] = []

        for (const image of embed.images) {
          const {path, width, height, mime} = await compressImage(image)
          const response = await uploadBlob(agent, path, mime)

          images.push({
            image: response.data.blob,
            alt: image.alt,
            aspectRatio: {width, height},
          })
        }

        return {
          $type: 'app.bsky.embed.images',
          images: images,
        }
      }

      throw new Error(`unknown media type`)
    }

    async function resolveRecordEmbed(
      embed: PostRecordEmbed,
    ): Promise<AppBskyEmbedRecord.Main> {
      const record = await queryClient.fetchQuery<RecordReturn>({
        queryKey: Record_RQKEY(embed.kind, embed.uri),
      })

      return {
        $type: 'app.bsky.embed.record',
        record: {
          uri: record.data.uri,
          cid: record.data.cid,
        },
      }
    }

    if (root.type === 'recordWithMedia') {
      return {
        $type: 'app.bsky.embed.recordWithMedia',
        record: await resolveRecordEmbed(root.record),
        media: await resolveMediaEmbed(root.media),
      }
    } else if (root.type === 'record') {
      return await resolveRecordEmbed(root)
    } else {
      return await resolveMediaEmbed(root)
    }
  }
}

// Returns a transformed version of the object for use in DAG-CBOR.
const prepareObject = (v: any): any => {
  // IMPORTANT: BlobRef#ipld() returns the correct object we need for hashing,
  // the API client will convert this for you but we're hashing in the client,
  // so we need it *now*.
  if (v instanceof BlobRef) {
    return v.ipld()
  }

  // Walk through arrays
  if (Array.isArray(v)) {
    let pure = true

    const mapped = v.map(value => {
      if (value !== (value = prepareObject(value))) {
        pure = false
      }

      return value
    })

    return pure ? v : mapped
  }

  // Walk through plain objects
  if (isPlainObject(v)) {
    const obj: any = {}

    let pure = true

    for (const key in v) {
      let value = v[key]

      // `value` is undefined
      if (value === undefined) {
        pure = false
        continue
      }

      // `prepareObject` returned a value that's different from what we had before
      if (value !== (value = prepareObject(value))) {
        pure = false
      }

      obj[key] = value
    }

    // Return as is if we haven't needed to tamper with anything
    return pure ? v : obj
  }

  return v
}

const isPlainObject = (v: any): boolean => {
  if (typeof v !== 'object' || v === null) {
    return false
  }

  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}
