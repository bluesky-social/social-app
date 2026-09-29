import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useGetPost} from '#/state/queries/post'
import {normalizePostReference} from '#/view/screens/DebugComposer/postUrl'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {
  ThreadStoreProvider,
  useThreadStore,
} from '#/components/ComposerV2/hooks'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as toast from '#/components/Toast'
import {Text} from '#/components/Typography'

/**
 * Attach a URL to one post. "Resolve URL" reserves the record or media slot
 * and resolves through the real link resolver (posts, feeds, lists, starter
 * packs, external cards, chat invites). "Fetch & attach record" reads a real
 * post from the AppView and inserts it directly through setRecordAttachment,
 * exercising the direct-record path with genuine refs.
 */
export function AttachUrlDialogButton({
  postId,
  index,
}: {
  postId: string
  index: number
}) {
  const {t: l} = useLingui()
  const control = Dialog.useDialogControl()
  /*
   * Native dialogs portal their children to the app shell's bottom-sheet
   * outlet, outside this screen's ThreadStoreProvider. Capture the store
   * here, in the owning tree, and re-provide it inside Dialog.Outer so the
   * portalled content keeps reading the same store (see Menu/index.tsx for
   * the same pattern).
   */
  const store = useThreadStore()
  return (
    <>
      <Button
        label={l`Attach a URL to post ${index + 1}`}
        accessibilityHint={l`Opens a dialog to attach a link, record, or card`}
        testID={`composerV2Tester-post-${postId}-attach-url`}
        size="tiny"
        color="secondary"
        onPress={control.open}>
        <ButtonText>
          <Trans>Attach URL</Trans>
        </ButtonText>
      </Button>
      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <ThreadStoreProvider store={store}>
          <AttachUrlDialogInner postId={postId} />
        </ThreadStoreProvider>
      </Dialog.Outer>
    </>
  )
}

function AttachUrlDialogInner({postId}: {postId: string}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogContext()
  const store = useThreadStore()
  const getPost = useGetPost()
  const [url, setUrl] = useState('')

  const trimmed = url.trim()
  const postReference = normalizePostReference(trimmed)

  const onResolveUri = () => {
    if (!trimmed) return
    control.close(() => store.actions.addUri(postId, trimmed))
  }

  const onFetchRecord = () => {
    if (!postReference) return
    control.close(() => {
      void (async () => {
        try {
          const post = await getPost({uri: postReference})
          store.actions.setRecordAttachment(postId, {
            kind: 'post',
            record: {uri: post.uri, cid: post.cid},
            view: post,
          })
        } catch {
          toast.show(l`Could not fetch that post.`, {type: 'error'})
        }
      })()
    })
  }

  return (
    <Dialog.ScrollableInner label={l`Attach a URL`}>
      <View style={[a.gap_md]}>
        <Text style={[a.text_lg, a.font_bold]}>
          <Trans>Attach URL</Trans>
        </Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          <Trans>
            Post, feed, list, and starter pack URLs use the record slot; other
            URLs become external cards in the media slot.
          </Trans>
        </Text>
        <TextField.Root>
          <Dialog.Input
            label={l`URL to attach`}
            testID="composerV2Tester-attach-url-input"
            defaultValue=""
            onChangeText={setUrl}
            placeholder={l`https:// or at://`}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </TextField.Root>
        <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
          <Button
            label={l`Resolve URL into an attachment`}
            testID="composerV2Tester-attach-url-resolve"
            size="small"
            color="primary"
            disabled={!trimmed}
            onPress={onResolveUri}>
            <ButtonText>
              <Trans>Resolve URL</Trans>
            </ButtonText>
          </Button>
          <Button
            label={l`Fetch the post and attach it as a record`}
            testID="composerV2Tester-attach-url-fetch-record"
            size="small"
            color="secondary"
            disabled={!postReference}
            onPress={onFetchRecord}>
            <ButtonText>
              <Trans>Fetch & attach record</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
