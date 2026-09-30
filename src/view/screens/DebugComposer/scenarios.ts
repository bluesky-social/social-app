import {type ImagePickerAsset} from 'expo-image-picker'

import {embeddingRules} from '#/state/queries/postgate/util'
import {type ComposerOpts} from '#/state/shell/composer'
import {type AssetType} from '#/view/com/composer/SelectMediaButton'
import {
  composerOptsToInitialState,
  draftToInitialState,
} from '#/components/ComposerV2/adapters'
import {
  type MediaAttachmentInput,
  type ThreadStoreInitialState,
} from '#/components/ComposerV2/store/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/**
 * Identifiers for the representative initialization cases the tester offers.
 * Every scenario produces a normalized `ThreadStoreInitialState` and builds a
 * brand-new store; none of them dispatch live edit actions.
 */
export type TesterScenarioId =
  | 'empty'
  | 'text'
  | 'mention'
  | 'thread'
  | 'draft-fixture'
  | 'reply'
  | 'quote'
  | 'media'

/**
 * A clearly labelled inbound draft fixture used only to exercise the
 * `draftToInitialState` adapter. It is synthetic tester data: it is never
 * saved anywhere, contains no repository references, and deliberately carries
 * no network-bearing media - a fabricated provider URL would trigger real
 * thumbnail/upload requests at runtime, and the tester only uses real
 * picker/tester-provided sources. The adapter's GIF-URL parsing is covered by
 * unit tests instead. The threadgate list includes an unknown future rule so
 * unknown-rule preservation is visible in the gate controls.
 */
export const TESTER_DRAFT_FIXTURE_ID = 'composer-v2-tester-fixture'
export const TESTER_DRAFT_FIXTURE: app.bsky.draft.defs.Draft = {
  langs: ['en'],
  posts: [
    {
      text: 'ComposerV2 tester adapter fixture, post one. This composition was normalized through draftToInitialState and is not a saved draft.',
      labels: {
        $type: 'com.atproto.label.defs#selfLabels',
        values: [{val: 'graphic-media'}],
      },
    },
    {
      text: 'Adapter fixture, post two, restored without attachments.',
    },
  ],
  threadgateAllow: [
    {$type: 'app.bsky.feed.threadgate#mentionRule'},
    {
      $type: 'app.bsky.feed.threadgate#composerV2TesterUnknownRule',
      note: 'unknown rule preserved by the tester',
    } as never,
  ],
  postgateEmbeddingRules: [embeddingRules.disableRule],
}

/** Picked assets grouped by the shared media button's classification. */
export type PickedAssets = {
  type: AssetType
  assets: ImagePickerAsset[]
}

export type TesterScenarioInput =
  | {id: 'empty'}
  | {id: 'text'}
  | {id: 'mention'; handle: string}
  | {id: 'thread'}
  | {id: 'draft-fixture'}
  | {id: 'reply'; post: app.bsky.feed.defs.PostView}
  | {id: 'quote'; post: app.bsky.feed.defs.PostView}
  | {id: 'media'; picked: PickedAssets}

/**
 * Build the normalized initial input for one tester scenario. Network-bearing
 * cases (reply/quote) receive a real fetched PostView so the resulting refs
 * and previews are never fabricated; media cases receive real picker output.
 */
export async function buildScenarioInitialState(
  input: TesterScenarioInput,
): Promise<ThreadStoreInitialState> {
  switch (input.id) {
    case 'empty':
      return composerOptsToInitialState({composerOpts: {}})
    case 'text':
      return composerOptsToInitialState({
        composerOpts: {
          text: 'Testing ComposerV2 with prefilled text and a link card https://bsky.app/about',
        },
      })
    case 'mention':
      return composerOptsToInitialState({composerOpts: {mention: input.handle}})
    case 'thread':
      /*
       * Normalized multi-post data, exercising per-post text, languages,
       * labels, and explicit tags without any network dependency.
       */
      return {
        posts: [
          {
            text: 'ComposerV2 tester thread, post one with explicit tags.',
            langs: ['en'],
            tags: ['composer-v2-tester', 'threads'],
          },
          {
            text: 'Post two carries a self label and two languages.',
            langs: ['en', 'de'],
            labels: ['graphic-media'],
          },
          {
            text: 'Post three is plain text.',
          },
        ],
        threadgateAllowRules: [{$type: 'app.bsky.feed.threadgate#mentionRule'}],
        postgateEmbeddingRules: [],
      }
    case 'draft-fixture':
      return draftToInitialState({
        draftId: TESTER_DRAFT_FIXTURE_ID,
        draft: TESTER_DRAFT_FIXTURE,
        loadedMedia: new Map(),
      })
    case 'reply':
      return composerOptsToInitialState({
        composerOpts: {
          replyTo: postViewToReplyRef({post: input.post}),
        },
      })
    case 'quote':
      return composerOptsToInitialState({composerOpts: {quote: input.post}})
    case 'media':
      return {posts: [{text: '', attachments: {media: pickedToMedia(input)}}]}
  }
}

/**
 * Convert a real fetched PostView into the shell's reply ref shape so the
 * reply scenario flows through the same `composerOptsToInitialState` adapter
 * as production intents.
 */
function postViewToReplyRef({
  post,
}: {
  post: app.bsky.feed.defs.PostView
}): NonNullable<ComposerOpts['replyTo']> {
  const record = bsky.isType(app.bsky.feed.post, post.record)
    ? post.record
    : undefined
  return {
    uri: post.uri,
    cid: post.cid,
    text: record?.text ?? '',
    langs: record?.langs ? [...record.langs] : undefined,
    author: post.author,
    embed: post.embed,
  }
}

/**
 * Convert validated picker output into initial media inputs, keeping the
 * metadata the picker already has so the worker does not read it again.
 * Videos keep the picker File on web so the eager worker can read it; animated
 * GIF files use the video pipeline, matching the production composer.
 */
function pickedToMedia({picked}: {picked: PickedAssets}): MediaAttachmentInput {
  if (picked.type === 'image') {
    return {
      kind: 'images',
      items: picked.assets.map(asset => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      })),
    }
  }
  const asset = picked.assets[0]
  return {
    kind: 'video',
    item: {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      mimeType: asset.mimeType ?? undefined,
      duration: asset.duration ?? undefined,
      fileSize: asset.fileSize,
      file: asset.file ?? undefined,
    },
  }
}
