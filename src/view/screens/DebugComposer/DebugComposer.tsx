/**
 * Minimal end-to-end playground for the ComposerV2 store. Wires a single
 * Composer text input to the store's root post, surfaces the live state
 * as a monospace dump, and exposes a few action buttons so we can poke at
 * the surface (addPost, removeMediaAttachment, removeRecordAttachment) without building the
 * full UI yet. Posts share the record slot with feeds, lists, and starter packs;
 * external cards share the media slot with images, video, and GIFs.
 *
 * Useful for verifying:
 *   - useSyncExternalStore actually rerenders on store mutations
 *   - onFacetCommitted -> addUri produces the expected pending/resolved/
 *     failed media or record attachment states
 *   - addUri validation (embedding-disabled, attachment conflicts) shows
 *     up the way we expect
 */
import {useMemo, useState} from 'react'
import {ScrollView, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useAppviewClient, useChatClient} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Composer} from '#/components/Composer'
import {
  ThreadStoreProvider,
  useThreadPost,
  useThreadPostRichText,
  useThreadState,
  useThreadStore,
} from '#/components/ComposerV2/hooks'
import {createThreadStore} from '#/components/ComposerV2/store'
import {Text} from '#/components/Typography'

export default function DebugComposer() {
  const appviewClient = useAppviewClient()
  const chatClient = useChatClient()
  const [store] = useState(() =>
    createThreadStore({resolvers: {appviewClient, chatClient}}),
  )
  return (
    <ThreadStoreProvider store={store}>
      <View style={[a.p_md, a.gap_md]}>
        <PostList />
        <Toolbar />
        <StateDump />
      </View>
    </ThreadStoreProvider>
  )
}

function PostList() {
  const state = useThreadState()
  const postIds = Object.keys(state.posts)
  return (
    <View style={[a.gap_md]}>
      {postIds.map((postId, i) => (
        <PostRow key={postId} postId={postId} index={i} />
      ))}
    </View>
  )
}

function PostRow({postId, index}: {postId: string; index: number}) {
  const post = useThreadPost(postId)
  const store = useThreadStore()
  const t = useTheme()

  // Composer is uncontrolled - defaultValue is read once on mount and the
  // input owns its text after that. We mirror every change back into the
  // store via onChange.
  const initialText = useMemo(() => post?.text ?? '', [])

  if (!post) return null

  return (
    <View
      style={[
        a.p_sm,
        a.rounded_md,
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
        a.gap_sm,
      ]}>
      <View style={[a.flex_row, a.justify_between, a.align_center]}>
        <Text style={[a.text_xs, {fontFamily: 'monospace'}]}>
          [{index}] {postId}
        </Text>
        {index > 0 && (
          <Button
            label={`Remove post ${index}`}
            size="tiny"
            color="secondary"
            onPress={() => store.actions.removePost(postId)}>
            <ButtonText>x</ButtonText>
          </Button>
        )}
      </View>
      <Composer
        label="Post text"
        placeholder="What's up? Paste a URL to test addUri."
        defaultValue={initialText}
        onChange={text => store.actions.setPostText(postId, text)}
        onFacetCommitted={facet => {
          if (facet.type === 'url') {
            store.actions.addUri(postId, facet.value)
          }
        }}
      />
      <PostFooter postId={postId} />
    </View>
  )
}

function PostFooter({postId}: {postId: string}) {
  const {t: l} = useLingui()
  const {shortenedGraphemeLength} = useThreadPostRichText(postId)
  const store = useThreadStore()
  return (
    <View style={[a.flex_row, a.flex_wrap, a.gap_sm, a.align_center]}>
      <Text style={[a.text_xs, {fontFamily: 'monospace'}]}>
        graphemes: {shortenedGraphemeLength} / 300
      </Text>
      <Button
        label={l`Remove media`}
        size="tiny"
        color="secondary"
        onPress={() => store.actions.removeMediaAttachment(postId)}>
        <ButtonText>
          <Trans>Remove media</Trans>
        </ButtonText>
      </Button>
      <Button
        label={l`Remove record`}
        size="tiny"
        color="secondary"
        onPress={() => store.actions.removeRecordAttachment(postId)}>
        <ButtonText>
          <Trans>Remove record</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}

function Toolbar() {
  const store = useThreadStore()
  return (
    <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
      <Button
        label="Append post"
        size="small"
        color="secondary"
        onPress={() => {
          // Read live state at click time so we always append after the
          // current last post (instead of capturing a stale id at render).
          const ids = Object.keys(store.getState().posts)
          const lastId = ids[ids.length - 1]
          if (lastId) store.actions.addPost('after', lastId)
        }}>
        <ButtonText>+ post</ButtonText>
      </Button>
    </View>
  )
}

function StateDump() {
  const state = useThreadState()
  const t = useTheme()

  // Functions (e.g. retry on failed states) are dropped by JSON.stringify;
  // Lexicon blob and view types serialize as plain objects.
  const dump = useMemo(() => JSON.stringify(state, null, 2), [state])

  return (
    <View
      style={[
        a.rounded_md,
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
      ]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[a.p_md]}>
        <Text style={[a.text_xs, {fontFamily: 'monospace'}]}>{dump}</Text>
      </ScrollView>
    </View>
  )
}
