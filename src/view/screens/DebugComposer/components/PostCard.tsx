import {useMemo} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {MAX_GRAPHEME_LENGTH} from '#/lib/constants'
import {type SelfLabel} from '#/lib/moderation'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import {LabelsBtn} from '#/view/com/composer/labels/LabelsBtn'
import {
  SelectMediaButton,
  type SelectMediaButtonProps,
} from '#/view/com/composer/SelectMediaButton'
import {
  MediaAttachmentView,
  RecordAttachmentView,
} from '#/view/screens/DebugComposer/components/AttachmentControls'
import {AttachUrlDialogButton} from '#/view/screens/DebugComposer/components/RecordAttachControls'
import {parseTagsInput} from '#/view/screens/DebugComposer/parseTagsInput'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Composer} from '#/components/Composer'
import {
  useThreadPost,
  useThreadPostRichText,
  useThreadStore,
} from '#/components/ComposerV2/hooks'
import {type AddMediaInput} from '#/components/ComposerV2/store/types'
import * as Dialog from '#/components/Dialog'
import {LanguageSelectDialog} from '#/components/dialogs/LanguageSelectDialog'
import * as TextField from '#/components/forms/TextField'
import * as toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {GifPickerDialog} from '#/features/gifPicker/GifPickerDialog'

/**
 * Editor for one thread post: text with facet detection, reorder/removal,
 * languages, labels, explicit tags, media/GIF/URL attachments, and per-item
 * upload state. All edits go straight to store actions; the text input is
 * uncontrolled and owned by React, mirrored into the store on change.
 */
export function PostCard({
  postId,
  index,
  isLast,
}: {
  postId: string
  index: number
  isLast: boolean
}) {
  const post = useThreadPost(postId)
  const store = useThreadStore()
  const {t: l} = useLingui()
  const t = useTheme()

  /*
   * The Composer input is uncontrolled: defaultValue is read once on mount
   * (sessions remount this card via the session key) and every change is
   * mirrored back into the store.
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      ]}
      testID={`composerV2Tester-post-${postId}`}>
      <View style={[a.flex_row, a.justify_between, a.align_center]}>
        <Text style={[a.text_xs, {fontFamily: 'monospace'}]}>
          [{index}] {postId}
        </Text>
        <View style={[a.flex_row, a.gap_xs]}>
          <Button
            disabled={index === 0}
            label={l`Move post ${index + 1} up`}
            testID={`composerV2Tester-post-${postId}-move-up`}
            size="tiny"
            color="secondary"
            onPress={() => store.actions.movePost(postId, index - 1)}>
            <ButtonText>
              <Trans>Up</Trans>
            </ButtonText>
          </Button>
          <Button
            disabled={isLast}
            label={l`Move post ${index + 1} down`}
            testID={`composerV2Tester-post-${postId}-move-down`}
            size="tiny"
            color="secondary"
            onPress={() => store.actions.movePost(postId, index + 1)}>
            <ButtonText>
              <Trans>Down</Trans>
            </ButtonText>
          </Button>
          <Button
            label={l`Remove post ${index + 1}`}
            testID={`composerV2Tester-post-${postId}-remove`}
            size="tiny"
            color="secondary"
            onPress={() => store.actions.removePost(postId)}>
            <ButtonText>
              <Trans>Remove</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>

      <Composer
        label={l`Post ${index + 1} text`}
        placeholder={l`Write here. Pasting a URL attaches it when committed.`}
        defaultValue={initialText}
        testID={`composerV2Tester-post-${postId}-text`}
        onChange={text => store.actions.setPostText(postId, text)}
        onFacetCommitted={facet => {
          if (facet.type === 'url') {
            store.actions.addUri(postId, facet.value)
          }
        }}
      />

      <PostMetaRow postId={postId} index={index} />
      <RecordAttachmentView postId={postId} />
      <MediaAttachmentView postId={postId} />
    </View>
  )
}

/** Grapheme feedback plus the per-post editing controls. */
function PostMetaRow({postId, index}: {postId: string; index: number}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const store = useThreadStore()
  const post = useThreadPost(postId)
  const {shortenedGraphemeLength} = useThreadPostRichText(postId)
  const languageControl = Dialog.useDialogControl()
  const gifControl = Dialog.useDialogControl()

  if (!post) return null

  const onSelectAssets: SelectMediaButtonProps['onSelectAssets'] = ({
    type,
    assets,
    errors,
  }) => {
    for (const error of errors) {
      toast.show(error, {type: 'warning'})
    }
    if (assets.length === 0) return
    let inputs: AddMediaInput[]
    if (type === 'image') {
      inputs = assets.map(asset => ({
        kind: 'image',
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType ?? undefined,
      }))
    } else {
      /* Animated GIF files use the video pipeline, like production. */
      const asset = assets[0]
      inputs = [
        {
          kind: 'video',
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          mimeType: asset.mimeType ?? 'video/mp4',
          duration: asset.duration ?? undefined,
          file: asset.file ?? undefined,
        },
      ]
    }
    store.actions.addMedia(postId, inputs)
  }

  const media = post.attachments.media
  const imageCount =
    media?.state === 'resolved' && media.kind === 'images'
      ? media.items.length
      : 0
  const mediaSelectionDisabled =
    post.imageSelectionsRemaining === 0 && post.videoSelectionsRemaining === 0
  const gifSelectionDisabled = post.gifSelectionsRemaining === 0

  return (
    <View style={[a.gap_sm]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
        <Text style={[a.text_xs, {fontFamily: 'monospace'}]}>
          {shortenedGraphemeLength}/{MAX_GRAPHEME_LENGTH}
        </Text>
        <CharProgress count={shortenedGraphemeLength} size={20} />
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          <Trans>
            Capacity: {post.imageSelectionsRemaining} images ·{' '}
            {post.videoSelectionsRemaining} video ·{' '}
            {post.gifSelectionsRemaining} GIF
          </Trans>
        </Text>
      </View>

      <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_xs]}>
        <SelectMediaButton
          testID={`composerV2Tester-post-${postId}-media-picker`}
          disabled={mediaSelectionDisabled}
          allowedAssetTypes={imageCount > 0 ? 'image' : undefined}
          selectedAssetsCount={imageCount}
          onSelectAssets={onSelectAssets}
        />
        <Button
          label={l`Select a GIF for post ${index + 1}`}
          accessibilityHint={l`Opens the GIF picker dialog`}
          testID={`composerV2Tester-post-${postId}-gif`}
          size="tiny"
          color="secondary"
          disabled={gifSelectionDisabled}
          onPress={gifControl.open}>
          <ButtonText>
            <Trans>GIF</Trans>
          </ButtonText>
        </Button>
        <Button
          label={l`Choose languages for post ${index + 1}`}
          accessibilityHint={l`Opens the language selection dialog`}
          testID={`composerV2Tester-post-${postId}-langs`}
          size="tiny"
          color="secondary"
          onPress={languageControl.open}>
          <ButtonText>
            {post.langs.length > 0 ? (
              post.langs.join(', ')
            ) : (
              <Trans>Langs</Trans>
            )}
          </ButtonText>
        </Button>
        <LabelsBtn
          testID={`composerV2Tester-post-${postId}-labels`}
          labels={post.labels as SelfLabel[]}
          onChange={labels => store.actions.setPostLabels(postId, labels)}
        />
        <AttachUrlDialogButton postId={postId} index={index} />
      </View>

      <TagsInput postId={postId} index={index} />

      <LanguageSelectDialog
        control={languageControl}
        titleText={<Trans>Choose post languages</Trans>}
        subtitleText={<Trans>Select up to 3 languages used in this post</Trans>}
        currentLanguages={post.langs}
        maxLanguages={3}
        onSelectLanguages={languages =>
          store.actions.setPostLanguages(postId, languages)
        }
      />
      <GifPickerDialog
        control={gifControl}
        onSelectGif={gif =>
          store.actions.addMedia(postId, [{kind: 'gif', gif}])
        }
      />
    </View>
  )
}

/**
 * Explicit post tags, comma separated, emitted as post tags - separate from
 * #hashtags typed in the text. Deliberately utility-grade: the string is
 * split at commas into setPostTags on every change.
 */
function TagsInput({postId, index}: {postId: string; index: number}) {
  const {t: l} = useLingui()
  const store = useThreadStore()
  const post = useThreadPost(postId)
  /*
   * Uncontrolled, like the post text: the initial value is read once on
   * mount and sessions remount this card via the session key.
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialTags = useMemo(() => (post?.tags ?? []).join(', '), [])
  if (!post) return null
  return (
    <TextField.Root>
      <TextField.Input
        label={l`Explicit tags for post ${index + 1}, comma separated`}
        testID={`composerV2Tester-post-${postId}-tags`}
        defaultValue={initialTags}
        onChangeText={text =>
          store.actions.setPostTags(postId, parseTagsInput({text}))
        }
        placeholder={l`Tags, comma separated`}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </TextField.Root>
  )
}
