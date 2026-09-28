import {useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {Trans, useLingui} from '@lingui/react/macro'

import {MAX_ALT_TEXT} from '#/lib/constants'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {
  ThreadStoreProvider,
  useThreadPost,
  useThreadStore,
} from '#/components/ComposerV2/hooks'
import {
  type PostMediaGif,
  type PostMediaImage,
  type PostMediaItem,
  type PostMediaUploadStatus,
  type PostMediaVideo,
} from '#/components/ComposerV2/store/types'
import {useUploadPhaseLabel} from '#/components/ComposerV2/tester/messages'
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
  const {t: l} = useLingui()
  const t = useTheme()
  const store = useThreadStore()
  const post = useThreadPost(postId)
  const record = post?.attachments.record
  if (!record) return null

  return (
    <View
      style={[
        a.p_sm,
        a.rounded_sm,
        a.border,
        a.gap_xs,
        t.atoms.border_contrast_low,
      ]}
      testID={`composerV2Tester-post-${postId}-record`}>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
        <Text style={[a.text_xs, a.font_bold]}>
          <Trans>Record attachment</Trans>
        </Text>
        {record.state === 'pending' && <Loader size="xs" />}
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {record.state === 'resolved' ? record.kind : record.state}
        </Text>
        <Button
          label={l`Remove record attachment`}
          testID={`composerV2Tester-post-${postId}-remove-record`}
          size="tiny"
          color="secondary"
          onPress={() => store.actions.removeRecordAttachment(postId)}>
          <ButtonText>
            <Trans>Remove</Trans>
          </ButtonText>
        </Button>
      </View>
      <Text style={[a.text_xs, t.atoms.text_contrast_medium]} numberOfLines={1}>
        {record.state === 'resolved' ? record.record.uri : record.uri}
      </Text>
      {record.state === 'failed' && (
        <FailureRow
          error={
            record.code === 'embedding-disabled'
              ? l`This post does not allow embedding.`
              : l`The link could not be resolved. Please try again.`
          }
          retryable={!!record.retry}
          onRetry={record.retry}
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
export function MediaAttachmentView({postId}: {postId: string}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const store = useThreadStore()
  const post = useThreadPost(postId)
  const media = post?.attachments.media
  if (!media) return null

  return (
    <View
      style={[
        a.p_sm,
        a.rounded_sm,
        a.border,
        a.gap_sm,
        t.atoms.border_contrast_low,
      ]}
      testID={`composerV2Tester-post-${postId}-media`}>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
        <Text style={[a.text_xs, a.font_bold]}>
          <Trans>Media attachment</Trans>
        </Text>
        {media.state === 'pending' && <Loader size="xs" />}
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {media.state === 'resolved' ? media.kind : media.state}
        </Text>
        <Button
          label={l`Remove media attachment`}
          testID={`composerV2Tester-post-${postId}-remove-media`}
          size="tiny"
          color="secondary"
          onPress={() => store.actions.removeMediaAttachment(postId)}>
          <ButtonText>
            <Trans>Remove all</Trans>
          </ButtonText>
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
          error={
            media.code === 'embedding-disabled'
              ? l`This post does not allow embedding.`
              : l`The link could not be resolved. Please try again.`
          }
          retryable={!!media.retry}
          onRetry={media.retry}
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
            />
          ))}
        </View>
      )}
      {media.state === 'resolved' && media.kind === 'video' && (
        <VideoItemRow postId={postId} item={media.item} />
      )}
      {media.state === 'resolved' && media.kind === 'gif' && (
        <GifItemRow postId={postId} item={media.item} />
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
              accessibilityLabel={l`External embed thumbnail`}
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
}: {
  postId: string
  item: PostMediaImage
  index: number
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const store = useThreadStore()
  return (
    <View
      style={[a.flex_row, a.gap_sm, a.align_center]}
      testID={`composerV2Tester-media-${item.id}`}>
      <Image
        source={{uri: item.uri}}
        style={[a.rounded_sm, {width: 48, height: 48}]}
        accessibilityLabel={l`Image ${index + 1} preview`}
        accessibilityHint=""
        accessibilityIgnoresInvertColors
      />
      <View style={[a.flex_1, a.gap_2xs]}>
        <UploadStatusLine upload={item.upload} />
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {item.altText ? (
            <Trans>Alt text added</Trans>
          ) : (
            <Trans>No alt text</Trans>
          )}
        </Text>
        <FailureRow
          error={item.upload.state === 'failed' ? item.upload.error : undefined}
          retryable={
            item.upload.state === 'failed' && item.upload.retryable !== false
          }
          onRetry={() => store.actions.retryMediaUpload(postId, item.id)}
          testID={`composerV2Tester-media-${item.id}-retry`}
        />
      </View>
      <View style={[a.gap_xs]}>
        <AltTextDialogButton postId={postId} item={item} />
        <Button
          label={l`Remove image ${index + 1}`}
          testID={`composerV2Tester-media-${item.id}-remove`}
          size="tiny"
          color="secondary"
          onPress={() => store.actions.removeMedia(postId, item.id)}>
          <ButtonText>
            <Trans>Remove</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}

function VideoItemRow({postId, item}: {postId: string; item: PostMediaVideo}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const store = useThreadStore()
  return (
    <View style={[a.gap_xs]} testID={`composerV2Tester-media-${item.id}`}>
      <UploadStatusLine upload={item.upload} />
      <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
        {item.altText ? (
          <Trans>Alt text added</Trans>
        ) : (
          <Trans>No alt text</Trans>
        )}
        {' · '}
        <Trans>Captions: {item.captions.length}</Trans>
        {' · '}
        <Trans>Uploaded captions: {item.captionBlobs.length}</Trans>
      </Text>
      <FailureRow
        error={item.upload.state === 'failed' ? item.upload.error : undefined}
        retryable={
          item.upload.state === 'failed' && item.upload.retryable !== false
        }
        onRetry={() => store.actions.retryMediaUpload(postId, item.id)}
        testID={`composerV2Tester-media-${item.id}-retry`}
      />
      <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
        <AltTextDialogButton postId={postId} item={item} />
        <CaptionsDialogButton postId={postId} item={item} />
        <Button
          label={l`Remove video`}
          testID={`composerV2Tester-media-${item.id}-remove`}
          size="tiny"
          color="secondary"
          onPress={() => store.actions.removeMedia(postId, item.id)}>
          <ButtonText>
            <Trans>Remove</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}

function GifItemRow({postId, item}: {postId: string; item: PostMediaGif}) {
  const {t: l} = useLingui()
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
          accessibilityLabel={l`GIF preview`}
          accessibilityHint=""
          accessibilityIgnoresInvertColors
        />
      )}
      <View style={[a.flex_1, a.gap_2xs]}>
        <Text style={[a.text_xs]}>
          <Trans>GIF (no upload required)</Trans>
        </Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {item.altText ? (
            <Trans>Alt text added</Trans>
          ) : (
            <Trans>No alt text</Trans>
          )}
        </Text>
      </View>
      <View style={[a.gap_xs]}>
        <AltTextDialogButton postId={postId} item={item} />
        <Button
          label={l`Remove GIF`}
          testID={`composerV2Tester-media-${item.id}-remove`}
          size="tiny"
          color="secondary"
          onPress={() => store.actions.removeMedia(postId, item.id)}>
          <ButtonText>
            <Trans>Remove</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}

/** Live phase/progress line for one real upload worker. */
function UploadStatusLine({upload}: {upload: PostMediaUploadStatus}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const phaseLabel = useUploadPhaseLabel()
  let label: string
  switch (upload.state) {
    case 'pending':
      label = l`Upload queued`
      break
    case 'uploading': {
      const phase = upload.phase ? phaseLabel(upload.phase) : l`Working`
      label =
        upload.progress !== undefined
          ? `${phase} · ${Math.round(upload.progress * 100)}%`
          : phase
      break
    }
    case 'uploaded':
      label = l`Uploaded`
      break
    case 'failed':
      label =
        upload.retryable === false
          ? l`Failed (permanent)`
          : l`Failed (retryable)`
      break
  }
  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs]}>
      {(upload.state === 'pending' || upload.state === 'uploading') && (
        <Loader size="xs" />
      )}
      <Text
        style={[
          a.text_xs,
          upload.state === 'failed'
            ? {color: t.palette.negative_500}
            : t.atoms.text_contrast_medium,
        ]}>
        {label}
      </Text>
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
  onRetry: (() => void) | undefined
  testID: string
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  if (!error) return null
  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
      <Text style={[a.text_xs, a.flex_1, {color: t.palette.negative_500}]}>
        {error}
      </Text>
      {retryable && onRetry && (
        <Button
          label={l`Retry`}
          testID={testID}
          size="tiny"
          color="secondary"
          onPress={onRetry}>
          <ButtonText>
            <Trans>Retry</Trans>
          </ButtonText>
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
        label={l`Edit alt text`}
        testID={`composerV2Tester-media-${item.id}-alt`}
        size="tiny"
        color="secondary"
        onPress={control.open}>
        <ButtonText>
          <Trans>Alt</Trans>
        </ButtonText>
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
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()
  const store = useThreadStore()
  const [altText, setAltText] = useState(item.altText)
  return (
    <Dialog.ScrollableInner label={l`Edit alt text`}>
      <View style={[a.gap_md]}>
        <Text style={[a.text_lg, a.font_bold]}>
          <Trans>Alt text</Trans>
        </Text>
        <TextField.Root>
          <Dialog.Input
            label={l`Alt text`}
            testID="composerV2Tester-alt-input"
            defaultValue={item.altText}
            onChangeText={setAltText}
            placeholder={l`Describe this media`}
            maxLength={MAX_ALT_TEXT * 10}
            multiline
            style={{maxHeight: 300}}
          />
        </TextField.Root>
        <Button
          label={l`Save alt text`}
          testID="composerV2Tester-alt-save"
          size="small"
          color="primary"
          onPress={() =>
            control.close(() =>
              store.actions.updateMediaAltText(postId, item.id, altText),
            )
          }>
          <ButtonText>
            <Trans>Save</Trans>
          </ButtonText>
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
  const {t: l} = useLingui()
  const control = Dialog.useDialogControl()
  /* Same portal/context bridge as AltTextDialogButton above. */
  const store = useThreadStore()
  return (
    <>
      <Button
        label={l`Edit captions`}
        testID={`composerV2Tester-media-${item.id}-captions`}
        size="tiny"
        color="secondary"
        onPress={control.open}>
        <ButtonText>
          <Trans>Captions</Trans>
        </ButtonText>
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
  const {t: l} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogContext()
  const store = useThreadStore()
  const [captions, setCaptions] = useState(() =>
    item.captions.map(caption => ({...caption})),
  )
  const hasMissingLang = captions.some(caption => !caption.lang.trim())
  return (
    <Dialog.ScrollableInner label={l`Edit video captions`}>
      <View style={[a.gap_md]}>
        <Text style={[a.text_lg, a.font_bold]}>
          <Trans>Captions</Trans>
        </Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          <Trans>
            Changing captions restarts the caption upload. A completed video
            upload is reused.
          </Trans>
        </Text>
        {captions.map((caption, index) => (
          <View key={index} style={[a.gap_xs]}>
            <TextField.Root>
              <Dialog.Input
                label={l`Caption ${index + 1} language`}
                testID={`composerV2Tester-caption-${index}-lang`}
                defaultValue={caption.lang}
                onChangeText={lang =>
                  setCaptions(prev =>
                    prev.map((c, i) => (i === index ? {...c, lang} : c)),
                  )
                }
                placeholder={l`Language code, e.g. en`}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </TextField.Root>
            <TextField.Root>
              <Dialog.Input
                label={l`Caption ${index + 1} content`}
                testID={`composerV2Tester-caption-${index}-content`}
                defaultValue={caption.content}
                onChangeText={content =>
                  setCaptions(prev =>
                    prev.map((c, i) => (i === index ? {...c, content} : c)),
                  )
                }
                placeholder={l`WEBVTT caption content`}
                multiline
                style={{maxHeight: 160}}
              />
            </TextField.Root>
            <Button
              label={l`Remove caption ${index + 1}`}
              testID={`composerV2Tester-caption-${index}-remove`}
              size="tiny"
              color="secondary"
              onPress={() =>
                setCaptions(prev => prev.filter((_c, i) => i !== index))
              }>
              <ButtonText>
                <Trans>Remove caption</Trans>
              </ButtonText>
            </Button>
          </View>
        ))}
        <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
          <Button
            label={l`Add caption`}
            testID="composerV2Tester-caption-add"
            size="small"
            color="secondary"
            onPress={() =>
              setCaptions(prev => [
                ...prev,
                {lang: '', content: 'WEBVTT\n\n00:00.000 --> 00:02.000\n'},
              ])
            }>
            <ButtonText>
              <Trans>Add caption</Trans>
            </ButtonText>
          </Button>
          <Button
            label={l`Save captions`}
            testID="composerV2Tester-caption-save"
            size="small"
            color="primary"
            disabled={hasMissingLang}
            onPress={() =>
              control.close(() =>
                store.actions.setVideoCaptions(postId, item.id, captions),
              )
            }>
            <ButtonText>
              <Trans>Save</Trans>
            </ButtonText>
          </Button>
        </View>
        {hasMissingLang && (
          <Text style={[a.text_xs, {color: t.palette.negative_500}]}>
            <Trans>Every caption needs a language code before saving.</Trans>
          </Text>
        )}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
