import {useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'
import {nanoid} from 'nanoid/non-secure'

import {MAX_ALT_TEXT} from '#/lib/constants'
import {StatusBadgeText} from '#/view/screens/DebugComposer/components/StatusBadge'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {
  ThreadStoreProvider,
  useThreadPost,
  useThreadStore,
} from '#/components/ComposerV2/hooks'
import {
  getLinkFailureMessage,
  getUploadFailureMessage,
} from '#/components/ComposerV2/messages'
import {
  type PostMediaGif,
  type PostMediaImage,
  type PostMediaItem,
  type PostMediaVideo,
  type UploadStatus,
} from '#/components/ComposerV2/store/types'
import {captionLanguageError} from '#/components/ComposerV2/store/utils/captionLanguageError'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

/**
 * Record-slot display for one post: URL resolution progress, failures with
 * retry, the resolved record kind/ref, and removal. Structural data only, plus
 * the real record URI, which is a genuine ref rather than diagnostic leakage.
 */
export function RecordAttachmentView({postId}: {postId: string}) {
  const {i18n} = useLingui()
  const t = useTheme()
  const store = useThreadStore()
  const post = useThreadPost(postId)
  const record = post?.attachments.record
  if (!record) return null

  return (
    <View
      style={[a.pt_sm, a.border_t, a.gap_xs, t.atoms.border_contrast_low]}
      testID={`composerV2Tester-post-${postId}-record`}>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
        <Text style={[a.text_xs, a.font_bold]}>Record</Text>
        {record.state === 'pending' && <Loader size="xs" />}
        <StatusBadgeText
          tone={
            record.state === 'resolved'
              ? 'positive'
              : record.state === 'failed'
                ? 'negative'
                : 'progress'
          }>
          {record.state === 'resolved'
            ? `resolved · ${record.kind}`
            : record.state === 'failed'
              ? `failed · ${record.code} · ${record.retryable ? 'retryable' : 'permanent'}`
              : 'pending'}
        </StatusBadgeText>
        <Button
          label="Remove record attachment"
          testID={`composerV2Tester-post-${postId}-remove-record`}
          size="tiny"
          color="negative_subtle"
          onPress={() => store.actions.removeRecordAttachment(postId)}>
          <ButtonText>Remove</ButtonText>
        </Button>
      </View>
      <Text style={[a.text_xs, t.atoms.text_contrast_medium]} numberOfLines={1}>
        {record.state === 'resolved' ? record.record.uri : record.uri}
      </Text>
      {record.state === 'failed' && (
        <FailureRow
          error={getLinkFailureMessage({code: record.code, i18n})}
          retryable={record.retryable}
          onRetry={() => store.actions.retryAttachment(postId, 'record')}
          testID={`composerV2Tester-post-${postId}-record-retry`}
        />
      )}
    </View>
  )
}

/**
 * Media-slot display for one post: URL card resolution, image galleries with
 * per-item upload status and controls, video with captions, GIFs, and
 * external/chat cards. All upload work shown here is real.
 */
export function MediaAttachmentView({
  postId,
  planErrorMediaId,
}: {
  postId: string
  planErrorMediaId?: string
}) {
  const {i18n} = useLingui()
  const t = useTheme()
  const store = useThreadStore()
  const post = useThreadPost(postId)
  const media = post?.attachments.media
  if (!media) return null

  return (
    <View
      style={[a.pt_sm, a.border_t, a.gap_sm, t.atoms.border_contrast_low]}
      testID={`composerV2Tester-post-${postId}-media`}>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
        <Text style={[a.text_xs, a.font_bold]}>
          {media.state === 'resolved' ? `Media · ${media.kind}` : 'Media'}
        </Text>
        {media.state === 'pending' && <Loader size="xs" />}
        {media.state !== 'resolved' && (
          <StatusBadgeText
            tone={media.state === 'failed' ? 'negative' : 'progress'}>
            {media.state === 'failed'
              ? `failed · ${media.code} · ${media.retryable ? 'retryable' : 'permanent'}`
              : 'pending'}
          </StatusBadgeText>
        )}
        {media.state === 'resolved' &&
          (media.kind === 'external' || media.kind === 'chat-invite') && (
            <StatusBadgeText tone="positive">resolved</StatusBadgeText>
          )}
        <Button
          label="Remove media attachment"
          testID={`composerV2Tester-post-${postId}-remove-media`}
          size="tiny"
          color="negative_subtle"
          onPress={() => store.actions.removeMediaAttachment(postId)}>
          <ButtonText>Remove all</ButtonText>
        </Button>
      </View>

      {media.state !== 'resolved' && (
        <Text
          style={[a.text_xs, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {media.uri}
        </Text>
      )}
      {media.state === 'failed' && (
        <FailureRow
          error={getLinkFailureMessage({code: media.code, i18n})}
          retryable={media.retryable}
          onRetry={() => store.actions.retryAttachment(postId, 'media')}
          testID={`composerV2Tester-post-${postId}-media-retry`}
        />
      )}

      {media.state === 'resolved' && media.kind === 'images' && (
        <View style={[a.gap_sm]}>
          {media.items.map((item, index) => (
            <ImageItemRow
              key={item.id}
              postId={postId}
              item={item}
              index={index}
              hasPlanError={item.id === planErrorMediaId}
            />
          ))}
        </View>
      )}
      {media.state === 'resolved' && media.kind === 'video' && (
        <VideoItemRow
          postId={postId}
          item={media.item}
          hasPlanError={media.item.id === planErrorMediaId}
        />
      )}
      {media.state === 'resolved' && media.kind === 'gif' && (
        <GifItemRow
          postId={postId}
          item={media.item}
          hasPlanError={media.item.id === planErrorMediaId}
        />
      )}
      {media.state === 'resolved' && media.kind === 'external' && (
        <View style={[a.gap_xs]}>
          {media.thumb && (
            <Image
              source={{
                uri: media.thumb.transformed?.path ?? media.thumb.source.path,
              }}
              style={[a.rounded_sm, {width: 120, height: 80}]}
              contentFit="contain"
              accessibilityLabel="External embed thumbnail"
              accessibilityHint=""
              accessibilityIgnoresInvertColors
            />
          )}
          <Text
            emoji
            selectable
            style={[a.text_xs, {fontFamily: 'monospace'}]}
            testID={`composerV2Tester-post-${postId}-external-fields`}>
            {JSON.stringify(media, null, 2)}
          </Text>
        </View>
      )}
      {media.state === 'resolved' && media.kind === 'chat-invite' && (
        <Text
          style={[a.text_xs, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {media.uri}
        </Text>
      )}
    </View>
  )
}

function ImageItemRow({
  postId,
  item,
  index,
  hasPlanError,
}: {
  postId: string
  item: PostMediaImage
  index: number
  hasPlanError: boolean
}) {
  const {i18n} = useLingui()
  const t = useTheme()
  const store = useThreadStore()
  return (
    <View
      style={[a.flex_row, a.flex_wrap, a.gap_sm, a.align_center]}
      testID={`composerV2Tester-media-${item.id}`}>
      <Image
        source={{uri: item.uri}}
        style={[a.rounded_sm, {width: 48, height: 48}]}
        accessibilityLabel={`Image ${index + 1} preview`}
        accessibilityHint=""
        accessibilityIgnoresInvertColors
      />
      <View style={[a.flex_1, a.gap_2xs]}>
        <Text
          selectable
          style={[
            a.text_xs,
            t.atoms.text_contrast_medium,
            {fontFamily: 'monospace'},
          ]}>
          {item.id}
        </Text>
        <UploadStatusLine upload={item.upload} />
        <Text
          style={[
            a.text_xs,
            hasPlanError
              ? {color: t.palette.negative_500}
              : t.atoms.text_contrast_medium,
          ]}>
          {item.altText ? 'Alt text added' : 'No alt text'}
        </Text>
        <FailureRow
          error={
            item.upload.state === 'failed'
              ? getUploadFailureMessage({failure: item.upload, i18n})
              : undefined
          }
          retryable={item.upload.state === 'failed' && item.upload.retryable}
          onRetry={() => store.actions.retryMediaUpload(postId, item.id)}
          testID={`composerV2Tester-media-${item.id}-retry`}
        />
      </View>
      <View style={[a.gap_xs]}>
        <AltTextDialogButton postId={postId} item={item} />
        <Button
          label={`Remove image ${index + 1}`}
          testID={`composerV2Tester-media-${item.id}-remove`}
          size="tiny"
          color="secondary"
          onPress={() => store.actions.removeMedia(postId, item.id)}>
          <ButtonText>Remove</ButtonText>
        </Button>
      </View>
    </View>
  )
}

function VideoItemRow({
  postId,
  item,
  hasPlanError,
}: {
  postId: string
  item: PostMediaVideo
  hasPlanError: boolean
}) {
  const {i18n} = useLingui()
  const t = useTheme()
  const store = useThreadStore()
  return (
    <View style={[a.gap_xs]} testID={`composerV2Tester-media-${item.id}`}>
      <Text
        selectable
        style={[
          a.text_xs,
          t.atoms.text_contrast_medium,
          {fontFamily: 'monospace'},
        ]}>
        {item.id}
      </Text>
      <UploadStatusLine upload={item.upload} />
      <Text
        style={[
          a.text_xs,
          hasPlanError
            ? {color: t.palette.negative_500}
            : t.atoms.text_contrast_medium,
        ]}>
        {item.altText ? 'Alt text added' : 'No alt text'}
        {' · '}
        Captions: {item.captions.length}
        {' · '}
        Uploaded captions: {item.captionBlobs.length}
      </Text>
      <FailureRow
        error={
          item.upload.state === 'failed'
            ? getUploadFailureMessage({failure: item.upload, i18n})
            : undefined
        }
        retryable={item.upload.state === 'failed' && item.upload.retryable}
        onRetry={() => store.actions.retryMediaUpload(postId, item.id)}
        testID={`composerV2Tester-media-${item.id}-retry`}
      />
      <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
        <AltTextDialogButton postId={postId} item={item} />
        <CaptionsDialogButton postId={postId} item={item} />
        <Button
          label="Remove video"
          testID={`composerV2Tester-media-${item.id}-remove`}
          size="tiny"
          color="secondary"
          onPress={() => store.actions.removeMedia(postId, item.id)}>
          <ButtonText>Remove</ButtonText>
        </Button>
      </View>
    </View>
  )
}

function GifItemRow({
  postId,
  item,
  hasPlanError,
}: {
  postId: string
  item: PostMediaGif
  hasPlanError: boolean
}) {
  const t = useTheme()
  const store = useThreadStore()
  const previewUrl =
    item.gif.media_formats.preview?.url ?? item.gif.media_formats.gif?.url
  return (
    <View
      style={[a.flex_row, a.gap_sm, a.align_center]}
      testID={`composerV2Tester-media-${item.id}`}>
      {!!previewUrl && (
        <Image
          source={{uri: previewUrl}}
          style={[a.rounded_sm, {width: 48, height: 48}]}
          accessibilityLabel="GIF preview"
          accessibilityHint=""
          accessibilityIgnoresInvertColors
        />
      )}
      <View style={[a.flex_1, a.gap_2xs]}>
        <Text style={[a.text_xs]}>GIF (no upload required)</Text>
        <Text
          style={[
            a.text_xs,
            hasPlanError
              ? {color: t.palette.negative_500}
              : t.atoms.text_contrast_medium,
          ]}>
          {item.altText ? 'Alt text added' : 'No alt text'}
        </Text>
      </View>
      <View style={[a.gap_xs]}>
        <AltTextDialogButton postId={postId} item={item} />
        <Button
          label="Remove GIF"
          testID={`composerV2Tester-media-${item.id}-remove`}
          size="tiny"
          color="secondary"
          onPress={() => store.actions.removeMedia(postId, item.id)}>
          <ButtonText>Remove</ButtonText>
        </Button>
      </View>
    </View>
  )
}

/** Live phase/progress line for one real upload worker. */
function UploadStatusLine({upload}: {upload: UploadStatus}) {
  let label: string
  switch (upload.state) {
    case 'pending':
      label = 'pending'
      break
    case 'uploading': {
      const phase = upload.phase ?? 'working'
      label =
        upload.progress !== undefined
          ? `uploading · ${phase} · ${Math.round(upload.progress * 100)}%`
          : `uploading · ${phase}`
      break
    }
    case 'uploaded':
      label = 'uploaded'
      break
    case 'failed':
      label = `failed · ${upload.code} · ${upload.retryable ? 'retryable' : 'permanent'}`
      break
  }
  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs]}>
      {(upload.state === 'pending' || upload.state === 'uploading') && (
        <Loader size="xs" />
      )}
      <StatusBadgeText
        tone={
          upload.state === 'failed'
            ? 'negative'
            : upload.state === 'uploaded'
              ? 'positive'
              : upload.state === 'uploading'
                ? 'progress'
                : 'neutral'
        }>
        {label}
      </StatusBadgeText>
    </View>
  )
}

/** Shared failure line with an optional retry for retryable errors. */
function FailureRow({
  error,
  retryable,
  onRetry,
  testID,
}: {
  error: string | undefined
  retryable: boolean
  onRetry: () => void
  testID: string
}) {
  const t = useTheme()
  if (!error) return null
  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
      <Text style={[a.text_xs, a.flex_1, {color: t.palette.negative_500}]}>
        {error}
      </Text>
      {retryable && (
        <Button
          label="Retry"
          testID={testID}
          size="tiny"
          color="negative"
          onPress={onRetry}>
          <ButtonText>Retry</ButtonText>
        </Button>
      )}
    </View>
  )
}

/** Alt-text editor for one image, video, or GIF item. */
function AltTextDialogButton({
  postId,
  item,
}: {
  postId: string
  item: PostMediaItem
}) {
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
        label="Edit alt text"
        testID={`composerV2Tester-media-${item.id}-alt`}
        size="tiny"
        color="secondary"
        onPress={control.open}>
        <ButtonText>Alt</ButtonText>
      </Button>
      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <ThreadStoreProvider store={store}>
          <AltTextDialogInner postId={postId} item={item} />
        </ThreadStoreProvider>
      </Dialog.Outer>
    </>
  )
}

function AltTextDialogInner({
  postId,
  item,
}: {
  postId: string
  item: PostMediaItem
}) {
  const control = Dialog.useDialogContext()
  const store = useThreadStore()
  const [altText, setAltText] = useState(item.altText)
  return (
    <Dialog.ScrollableInner label="Edit alt text">
      <View style={[a.gap_md]}>
        <Text style={[a.text_lg, a.font_bold]}>Alt text</Text>
        <TextField.Root>
          <Dialog.Input
            label="Alt text"
            testID="composerV2Tester-alt-input"
            defaultValue={item.altText}
            onChangeText={setAltText}
            placeholder="Describe this media"
            maxLength={MAX_ALT_TEXT * 10}
            multiline
            style={{maxHeight: 300}}
          />
        </TextField.Root>
        <Button
          label="Save alt text"
          testID="composerV2Tester-alt-save"
          size="small"
          color="primary"
          onPress={() =>
            control.close(() =>
              store.actions.updateMediaAltText(postId, item.id, altText),
            )
          }>
          <ButtonText>Save</ButtonText>
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

/** Caption editor for a video item, committed through setVideoCaptions. */
function CaptionsDialogButton({
  postId,
  item,
}: {
  postId: string
  item: PostMediaVideo
}) {
  const control = Dialog.useDialogControl()
  /* Same portal/context bridge as AltTextDialogButton above. */
  const store = useThreadStore()
  return (
    <>
      <Button
        label="Edit captions"
        testID={`composerV2Tester-media-${item.id}-captions`}
        size="tiny"
        color="secondary"
        onPress={control.open}>
        <ButtonText>Captions</ButtonText>
      </Button>
      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <ThreadStoreProvider store={store}>
          <CaptionsDialogInner postId={postId} item={item} />
        </ThreadStoreProvider>
      </Dialog.Outer>
    </>
  )
}

function CaptionsDialogInner({
  postId,
  item,
}: {
  postId: string
  item: PostMediaVideo
}) {
  const t = useTheme()
  const control = Dialog.useDialogContext()
  const store = useThreadStore()
  /*
   * Each draft row carries a stable key. The language field is uncontrolled, so
   * index keys would leave a removed row's text in the next row's input.
   */
  const [captions, setCaptions] = useState(() =>
    item.captions.map(caption => ({...caption, key: nanoid()})),
  )
  const languageError = captionLanguageError({captions})
  return (
    <Dialog.ScrollableInner label="Edit video captions">
      <View style={[a.gap_md]}>
        <Text style={[a.text_lg, a.font_bold]}>Captions</Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          Changing captions restarts the caption upload. A completed video
          upload is reused.
        </Text>
        {captions.map((caption, index) => (
          <View key={caption.key} style={[a.gap_xs]}>
            <TextField.Root>
              <Dialog.Input
                label={`Caption ${index + 1} language`}
                testID={`composerV2Tester-caption-${index}-lang`}
                defaultValue={caption.lang}
                onChangeText={lang =>
                  setCaptions(prev =>
                    prev.map((c, i) => (i === index ? {...c, lang} : c)),
                  )
                }
                placeholder="Language code, e.g. en"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </TextField.Root>
            <TextField.Root>
              <Dialog.Input
                label={`Caption ${index + 1} content`}
                testID={`composerV2Tester-caption-${index}-content`}
                /*
                 * Controlled on purpose. With `defaultValue`, React DOM
                 * rewrites the textarea's text node on every re-render, such
                 * as the hover state flush that lands when focus leaves the
                 * language field. Radix FocusScope reads that as a removed
                 * node and steals focus to the dialog, so the click never
                 * reaches the textarea. `value` only rewrites on a change.
                 */
                value={caption.content}
                onChangeText={content =>
                  setCaptions(prev =>
                    prev.map((c, i) => (i === index ? {...c, content} : c)),
                  )
                }
                placeholder="WEBVTT caption content"
                multiline
                style={{maxHeight: 160}}
              />
            </TextField.Root>
            <Button
              label={`Remove caption ${index + 1}`}
              testID={`composerV2Tester-caption-${index}-remove`}
              size="tiny"
              color="secondary"
              onPress={() =>
                setCaptions(prev => prev.filter((_c, i) => i !== index))
              }>
              <ButtonText>Remove caption</ButtonText>
            </Button>
          </View>
        ))}
        <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
          <Button
            label="Add caption"
            testID="composerV2Tester-caption-add"
            size="small"
            color="secondary"
            onPress={() =>
              setCaptions(prev => [
                ...prev,
                {
                  key: nanoid(),
                  lang: '',
                  content: 'WEBVTT\n\n00:00.000 --> 00:02.000\n',
                },
              ])
            }>
            <ButtonText>Add caption</ButtonText>
          </Button>
          <Button
            label="Save captions"
            testID="composerV2Tester-caption-save"
            size="small"
            color="primary"
            disabled={!!languageError}
            onPress={() =>
              control.close(() =>
                store.actions.setVideoCaptions(
                  postId,
                  item.id,
                  captions.map(({lang, content}) => ({lang, content})),
                ),
              )
            }>
            <ButtonText>Save</ButtonText>
          </Button>
        </View>
        {languageError === 'missing-caption-language' && (
          <Text style={[a.text_xs, {color: t.palette.negative_500}]}>
            Every caption needs a language code before saving.
          </Text>
        )}
        {languageError === 'duplicate-caption-language' && (
          <Text style={[a.text_xs, {color: t.palette.negative_500}]}>
            Each caption needs a different language code.
          </Text>
        )}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
