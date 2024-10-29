import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
// @ts-expect-error no type definition
import ProgressCircle from 'react-native-progress/Circle'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolateColor,
  LayoutAnimationConfig,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {ImagePickerAsset} from 'expo-image-picker'
import {
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
  BskyAgent,
  RichText,
} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import * as apilib from '#/lib/api/index'
import {EmbeddingDisabledError} from '#/lib/api/resolve'
import {until} from '#/lib/async/until'
import {MAX_GRAPHEME_LENGTH} from '#/lib/constants'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {useIsKeyboardVisible} from '#/lib/hooks/useIsKeyboardVisible'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {logEvent} from '#/lib/statsig/statsig'
import {cleanError} from '#/lib/strings/errors'
import {colors, s} from '#/lib/styles'
import {logger} from '#/logger'
import {isAndroid, isIOS, isNative, isWeb} from '#/platform/detection'
import {useDialogStateControlContext} from '#/state/dialogs'
import {emitPostCreated} from '#/state/events'
import {ComposerImage, pasteImage} from '#/state/gallery'
import {useModalControls} from '#/state/modals'
import {useRequireAltTextEnabled} from '#/state/preferences'
import {
  toPostLanguages,
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {useProfileQuery} from '#/state/queries/profile'
import {Gif} from '#/state/queries/tenor'
import {useAgent, useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell/composer'
import {ComposerOpts} from '#/state/shell/composer'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import {ComposerReplyTo} from '#/view/com/composer/ComposerReplyTo'
import {
  ExternalEmbedGif,
  ExternalEmbedLink,
} from '#/view/com/composer/ExternalEmbed'
import {GifAltTextDialog} from '#/view/com/composer/GifAltText'
import {LabelsBtn} from '#/view/com/composer/labels/LabelsBtn'
import {Gallery} from '#/view/com/composer/photos/Gallery'
import {OpenCameraBtn} from '#/view/com/composer/photos/OpenCameraBtn'
import {SelectGifBtn} from '#/view/com/composer/photos/SelectGifBtn'
import {SelectPhotoBtn} from '#/view/com/composer/photos/SelectPhotoBtn'
import {SelectLangBtn} from '#/view/com/composer/select-language/SelectLangBtn'
import {SuggestedLanguage} from '#/view/com/composer/select-language/SuggestedLanguage'
// TODO: Prevent naming components that coincide with RN primitives
// due to linting false positives
import {TextInput, TextInputRef} from '#/view/com/composer/text-input/TextInput'
import {ThreadgateBtn} from '#/view/com/composer/threadgate/ThreadgateBtn'
import {SelectVideoBtn} from '#/view/com/composer/videos/SelectVideoBtn'
import {SubtitleDialogBtn} from '#/view/com/composer/videos/SubtitleDialog'
import {VideoPreview} from '#/view/com/composer/videos/VideoPreview'
import {VideoTranscodeProgress} from '#/view/com/composer/videos/VideoTranscodeProgress'
import {LazyQuoteEmbed, QuoteX} from '#/view/com/util/post-embeds/QuoteEmbed'
import {Text} from '#/view/com/util/text/Text'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {EmojiArc_Stroke2_Corner0_Rounded as EmojiSmile} from '#/components/icons/Emoji'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import * as Prompt from '#/components/Prompt'
import {Text as NewText} from '#/components/Typography'
import {BottomSheetPortalProvider} from '../../../../modules/bottom-sheet'
import {
  ComposerAction,
  composerReducer,
  createComposerState,
  EmbedDraft,
  MAX_IMAGES,
  PostAction,
  PostDraft,
  ThreadDraft,
} from './state/composer'
import {NO_VIDEO, NoVideoState, processVideo, VideoState} from './state/video'

type CancelRef = {
  onPressCancel: () => void
}

type Props = ComposerOpts
export const ComposePost = ({
  replyTo,
  onPost,
  quote: initQuote,
  mention: initMention,
  openEmojiPicker,
  text: initText,
  imageUris: initImageUris,
  videoUri: initVideoUri,
  cancelRef,
}: Props & {
  cancelRef?: React.RefObject<CancelRef>
}) => {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const queryClient = useQueryClient()
  const currentDid = currentAccount!.did
  const {closeComposer} = useComposerControls()
  const {_} = useLingui()
  const requireAltTextEnabled = useRequireAltTextEnabled()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const textInput = useRef<TextInputRef>(null)
  const discardPromptControl = Prompt.usePromptControl()
  const {closeAllDialogs} = useDialogStateControlContext()
  const {closeAllModals} = useModalControls()

  const [isKeyboardVisible] = useIsKeyboardVisible({iosUseWillEvents: true})
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishingStage, setPublishingStage] = useState('')
  const [error, setError] = useState('')

  const [composerState, composerDispatch] = useReducer(
    composerReducer,
    {initImageUris, initQuoteUri: initQuote?.uri, initText, initMention},
    createComposerState,
  )

  // TODO: Display drafts for other posts in the thread.
  const thread = composerState.thread
  const draft = thread.posts[composerState.activePostIndex]
  const dispatch = useCallback((postAction: PostAction) => {
    composerDispatch({
      type: 'update_post',
      postAction,
    })
  }, [])

  let videoState: VideoState | NoVideoState = NO_VIDEO
  if (draft.embed.media?.type === 'video') {
    videoState = draft.embed.media.video
  }

  const selectVideo = React.useCallback(
    (asset: ImagePickerAsset) => {
      const abortController = new AbortController()
      dispatch({type: 'embed_add_video', asset, abortController})
      processVideo(
        asset,
        videoAction => dispatch({type: 'embed_update_video', videoAction}),
        agent,
        currentDid,
        abortController.signal,
        _,
      )
    },
    [_, agent, currentDid, dispatch],
  )

  // Whenever we receive an initial video uri, we should immediately run compression if necessary
  useEffect(() => {
    if (initVideoUri) {
      selectVideo(initVideoUri)
    }
  }, [initVideoUri, selectVideo])

  const clearVideo = React.useCallback(() => {
    videoState.abortController.abort()
    dispatch({type: 'embed_remove_video'})
  }, [videoState.abortController, dispatch])

  const [publishOnUpload, setPublishOnUpload] = useState(false)

  const onClose = useCallback(() => {
    closeComposer()
  }, [closeComposer])

  const insets = useSafeAreaInsets()
  const viewStyles = useMemo(
    () => ({
      paddingTop: isAndroid ? insets.top : 0,
      paddingBottom:
        isAndroid || (isIOS && !isKeyboardVisible) ? insets.bottom : 0,
    }),
    [insets, isKeyboardVisible],
  )

  const onPressCancel = useCallback(() => {
    if (
      thread.posts.some(
        post =>
          post.shortenedGraphemeLength > 0 ||
          post.embed.media ||
          post.embed.link,
      )
    ) {
      closeAllDialogs()
      Keyboard.dismiss()
      discardPromptControl.open()
    } else {
      onClose()
    }
  }, [thread, closeAllDialogs, discardPromptControl, onClose])

  useImperativeHandle(cancelRef, () => ({onPressCancel}))

  // On Android, pressing Back should ask confirmation.
  useEffect(() => {
    if (!isAndroid) {
      return
    }
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (closeAllDialogs() || closeAllModals()) {
          return true
        }
        onPressCancel()
        return true
      },
    )
    return () => {
      backHandler.remove()
    }
  }, [onPressCancel, closeAllDialogs, closeAllModals])

  const isAltTextRequiredAndMissing = useMemo(() => {
    if (!requireAltTextEnabled) {
      return false
    }
    return thread.posts.some(post => {
      const media = post.embed.media
      if (media) {
        if (media.type === 'images' && media.images.some(img => !img.alt)) {
          return true
        }
        if (media.type === 'gif' && !media.alt) {
          return true
        }
      }
    })
  }, [thread, requireAltTextEnabled])

  const canPost =
    !isAltTextRequiredAndMissing &&
    thread.posts.every(
      post =>
        post.shortenedGraphemeLength <= MAX_GRAPHEME_LENGTH &&
        !(
          post.richtext.text.trim().length === 0 &&
          !post.embed.link &&
          !post.embed.media &&
          !post.embed.quote
        ) &&
        !(
          post.embed.media?.type === 'video' &&
          post.embed.media.video.status === 'error'
        ),
    )

  const onPressPublish = React.useCallback(
    async (finishedUploading: boolean) => {
      if (isPublishing) {
        return
      }

      if (!canPost) {
        return
      }

      if (
        !finishedUploading &&
        thread.posts.some(
          post =>
            post.embed.media?.type === 'video' &&
            post.embed.media.video.asset &&
            post.embed.media.video.status !== 'done',
        )
      ) {
        setPublishOnUpload(true)
        return
      }

      setError('')
      setIsPublishing(true)

      let postUri
      try {
        postUri = (
          await apilib.post(agent, queryClient, {
            thread,
            replyTo: replyTo?.uri,
            onStateChange: setPublishingStage,
            langs: toPostLanguages(langPrefs.postLanguage),
          })
        ).uri
        try {
          await whenAppViewReady(agent, postUri, res => {
            const postedThread = res.data.thread
            return AppBskyFeedDefs.isThreadViewPost(postedThread)
          })
        } catch (waitErr: any) {
          logger.error(waitErr, {
            message: `Waiting for app view failed`,
          })
          // Keep going because the post *was* published.
        }
      } catch (e: any) {
        logger.error(e, {
          message: `Composer: create post failed`,
          hasImages: thread.posts.some(p => p.embed.media?.type === 'images'),
        })

        let err = cleanError(e.message)
        if (err.includes('not locate record')) {
          err = _(
            msg`We're sorry! The post you are replying to has been deleted.`,
          )
        } else if (e instanceof EmbeddingDisabledError) {
          err = _(msg`This post's author has disabled quote posts.`)
        }
        setError(err)
        setIsPublishing(false)
        return
      } finally {
        if (postUri) {
          let index = 0
          for (let post of thread.posts) {
            logEvent('post:create', {
              imageCount:
                post.embed.media?.type === 'images'
                  ? post.embed.media.images.length
                  : 0,
              isReply: index > 0 || !!replyTo,
              hasLink: !!post.embed.link,
              hasQuote: !!post.embed.quote,
              langs: langPrefs.postLanguage,
              logContext: 'Composer',
            })
            index++
          }
        }
      }
      if (postUri && !replyTo) {
        emitPostCreated()
      }
      setLangPrefs.savePostLanguageToHistory()
      if (initQuote) {
        // We want to wait for the quote count to update before we call `onPost`, which will refetch data
        whenAppViewReady(agent, initQuote.uri, res => {
          const quotedThread = res.data.thread
          if (
            AppBskyFeedDefs.isThreadViewPost(quotedThread) &&
            quotedThread.post.quoteCount !== initQuote.quoteCount
          ) {
            onPost?.(postUri)
            return true
          }
          return false
        })
      } else {
        onPost?.(postUri)
      }
      onClose()
      Toast.show(
        replyTo
          ? _(msg`Your reply has been published`)
          : _(msg`Your post has been published`),
      )
    },
    [
      _,
      agent,
      thread,
      canPost,
      isPublishing,
      langPrefs.postLanguage,
      onClose,
      onPost,
      initQuote,
      replyTo,
      setLangPrefs,
      queryClient,
    ],
  )

  React.useEffect(() => {
    if (videoState.pendingPublish && publishOnUpload) {
      if (!videoState.pendingPublish.mutableProcessed) {
        videoState.pendingPublish.mutableProcessed = true
        onPressPublish(true)
      }
    }
  }, [onPressPublish, publishOnUpload, videoState.pendingPublish])

  const onEmojiButtonPress = useCallback(() => {
    openEmojiPicker?.(textInput.current?.getCursorPosition())
  }, [openEmojiPicker])

  const {
    scrollHandler,
    onScrollViewContentSizeChange,
    onScrollViewLayout,
    topBarAnimatedStyle,
    bottomBarAnimatedStyle,
  } = useAnimatedBorders()

  const keyboardVerticalOffset = useKeyboardVerticalOffset()

  return (
    <BottomSheetPortalProvider>
      <KeyboardAvoidingView
        testID="composePostView"
        behavior={isIOS ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={a.flex_1}>
        <View
          style={[a.flex_1, viewStyles]}
          aria-modal
          accessibilityViewIsModal>
          <ComposerTopBar
            canPost={canPost}
            isReply={!!replyTo}
            isPublishQueued={videoState.status !== 'idle' && publishOnUpload}
            isPublishing={isPublishing}
            publishingStage={publishingStage}
            topBarAnimatedStyle={topBarAnimatedStyle}
            onCancel={onPressCancel}
            onPublish={() => onPressPublish(false)}>
            {isAltTextRequiredAndMissing && <AltTextReminder />}
            <ErrorBanner
              error={error}
              videoState={videoState}
              clearError={() => setError('')}
              clearVideo={clearVideo}
            />
          </ComposerTopBar>

          <Animated.ScrollView
            layout={native(LinearTransition)}
            onScroll={scrollHandler}
            style={styles.scrollView}
            keyboardShouldPersistTaps="always"
            onContentSizeChange={onScrollViewContentSizeChange}
            onLayout={onScrollViewLayout}>
            {replyTo ? <ComposerReplyTo replyTo={replyTo} /> : undefined}
            <ComposerPost
              draft={draft}
              dispatch={dispatch}
              textInput={textInput}
              isReply={!!replyTo}
              canRemoveQuote={!initQuote}
              onSelectVideo={selectVideo}
              onClearVideo={clearVideo}
              onPublish={() => onPressPublish(false)}
              onError={setError}
            />
          </Animated.ScrollView>

          <SuggestedLanguage text={draft.richtext.text} />

          <ComposerPills
            isReply={!!replyTo}
            post={draft}
            thread={composerState.thread}
            dispatch={composerDispatch}
            bottomBarAnimatedStyle={bottomBarAnimatedStyle}
          />

          <ComposerFooter
            draft={draft}
            dispatch={dispatch}
            onError={setError}
            onEmojiButtonPress={onEmojiButtonPress}
            onSelectVideo={selectVideo}
          />
        </View>

        <Prompt.Basic
          control={discardPromptControl}
          title={_(msg`Discard draft?`)}
          description={_(msg`Are you sure you'd like to discard this draft?`)}
          onConfirm={onClose}
          confirmButtonCta={_(msg`Discard`)}
          confirmButtonColor="negative"
        />
      </KeyboardAvoidingView>
    </BottomSheetPortalProvider>
  )
}

function ComposerPost({
  draft,
  dispatch,
  textInput,
  isReply,
  canRemoveQuote,
  onClearVideo,
  onSelectVideo,
  onError,
  onPublish,
}: {
  draft: PostDraft
  dispatch: (action: PostAction) => void
  textInput: React.Ref<TextInputRef>
  isReply: boolean
  canRemoveQuote: boolean
  onClearVideo: () => void
  onSelectVideo: (asset: ImagePickerAsset) => void
  onError: (error: string) => void
  onPublish: (richtext: RichText) => void
}) {
  const {currentAccount} = useSession()
  const currentDid = currentAccount!.did
  const {_} = useLingui()
  const {data: currentProfile} = useProfileQuery({did: currentDid})
  const richtext = draft.richtext
  const isTextOnly =
    !draft.embed.link && !draft.embed.quote && !draft.embed.media
  const forceMinHeight = isWeb && isTextOnly
  const selectTextInputPlaceholder = isReply
    ? _(msg`Write your reply`)
    : _(msg`What's up?`)

  const onImageAdd = useCallback(
    (next: ComposerImage[]) => {
      dispatch({
        type: 'embed_add_images',
        images: next,
      })
    },
    [dispatch],
  )

  const onNewLink = useCallback(
    (uri: string) => {
      dispatch({type: 'embed_add_uri', uri})
    },
    [dispatch],
  )

  const onPhotoPasted = useCallback(
    async (uri: string) => {
      if (uri.startsWith('data:video/')) {
        onSelectVideo({uri, type: 'video', height: 0, width: 0})
      } else {
        const res = await pasteImage(uri)
        onImageAdd([res])
      }
    },
    [onSelectVideo, onImageAdd],
  )

  return (
    <>
      <View
        style={[
          styles.textInputLayout,
          isNative && styles.textInputLayoutMobile,
        ]}>
        <UserAvatar
          avatar={currentProfile?.avatar}
          size={50}
          type={currentProfile?.associated?.labeler ? 'labeler' : 'user'}
        />
        <TextInput
          ref={textInput}
          richtext={richtext}
          placeholder={selectTextInputPlaceholder}
          autoFocus
          webForceMinHeight={forceMinHeight}
          setRichText={rt => {
            dispatch({type: 'update_richtext', richtext: rt})
          }}
          onPhotoPasted={onPhotoPasted}
          onNewLink={onNewLink}
          onError={onError}
          onPressPublish={onPublish}
          accessible={true}
          accessibilityLabel={_(msg`Write post`)}
          accessibilityHint={_(
            msg`Compose posts up to ${MAX_GRAPHEME_LENGTH} characters in length`,
          )}
        />
      </View>

      <ComposerEmbeds
        canRemoveQuote={canRemoveQuote}
        embed={draft.embed}
        dispatch={dispatch}
        clearVideo={onClearVideo}
      />
    </>
  )
}

function ComposerTopBar({
  canPost,
  isReply,
  isPublishQueued,
  isPublishing,
  publishingStage,
  onCancel,
  onPublish,
  topBarAnimatedStyle,
  children,
}: {
  isPublishing: boolean
  publishingStage: string
  canPost: boolean
  isReply: boolean
  isPublishQueued: boolean
  onCancel: () => void
  onPublish: () => void
  topBarAnimatedStyle: StyleProp<ViewStyle>
  children?: React.ReactNode
}) {
  const pal = usePalette('default')
  return (
    <Animated.View
      style={topBarAnimatedStyle}
      layout={native(LinearTransition)}>
      <View style={styles.topbarInner}>
        <Button
          label="Cancel"
          variant="ghost"
          color="primary"
          shape="default"
          size="small"
          style={[a.rounded_full, a.py_sm, {paddingLeft: 7, paddingRight: 7}]}
          onPress={onCancel}
          accessibilityHint="Closes post composer and discards post draft">
          <ButtonText style={[a.text_md]}>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        {isPublishing ? (
          <>
            <Text style={pal.textLight}>{publishingStage}</Text>
            <View style={styles.postBtn}>
              <ActivityIndicator />
            </View>
          </>
        ) : (
          <Button
            testID="composerPublishBtn"
            label={isReply ? 'Publish reply' : 'Publish post'}
            variant="solid"
            color="primary"
            shape="default"
            size="small"
            style={[a.rounded_full, a.py_sm]}
            onPress={onPublish}
            disabled={!canPost || isPublishQueued}>
            <ButtonText style={[a.text_md]}>
              {isReply ? (
                <Trans context="action">Reply</Trans>
              ) : (
                <Trans context="action">Post</Trans>
              )}
            </ButtonText>
          </Button>
        )}
      </View>
      {children}
    </Animated.View>
  )
}

function AltTextReminder() {
  const pal = usePalette('default')
  return (
    <View style={[styles.reminderLine, pal.viewLight]}>
      <View style={styles.errorIcon}>
        <FontAwesomeIcon
          icon="exclamation"
          style={{color: colors.red4}}
          size={10}
        />
      </View>
      <Text style={[pal.text, a.flex_1]}>
        <Trans>One or more images is missing alt text.</Trans>
      </Text>
    </View>
  )
}

function ComposerEmbeds({
  embed,
  dispatch,
  clearVideo,
  canRemoveQuote,
}: {
  embed: EmbedDraft
  dispatch: (action: PostAction) => void
  clearVideo: () => void
  canRemoveQuote: boolean
}) {
  const video = embed.media?.type === 'video' ? embed.media.video : null
  return (
    <>
      {embed.media?.type === 'images' && (
        <Gallery images={embed.media.images} dispatch={dispatch} />
      )}

      {embed.media?.type === 'gif' && (
        <View style={[a.relative, a.mt_lg]} key={embed.media.gif.url}>
          <ExternalEmbedGif
            gif={embed.media.gif}
            onRemove={() => dispatch({type: 'embed_remove_gif'})}
          />
          <GifAltTextDialog
            gif={embed.media.gif}
            altText={embed.media.alt ?? ''}
            onSubmit={(altText: string) => {
              dispatch({type: 'embed_update_gif', alt: altText})
            }}
          />
        </View>
      )}

      {!embed.media && embed.link && (
        <View style={[a.relative, a.mt_lg]} key={embed.link.uri}>
          <ExternalEmbedLink
            uri={embed.link.uri}
            hasQuote={!!embed.quote}
            onRemove={() => dispatch({type: 'embed_remove_link'})}
          />
        </View>
      )}

      <LayoutAnimationConfig skipExiting>
        {video && (
          <Animated.View
            style={[a.w_full, a.mt_lg]}
            entering={native(ZoomIn)}
            exiting={native(ZoomOut)}>
            {video.asset &&
              (video.status === 'compressing' ? (
                <VideoTranscodeProgress
                  asset={video.asset}
                  progress={video.progress}
                  clear={clearVideo}
                />
              ) : video.video ? (
                <VideoPreview
                  asset={video.asset}
                  video={video.video}
                  setDimensions={(width: number, height: number) => {
                    dispatch({
                      type: 'embed_update_video',
                      videoAction: {
                        type: 'update_dimensions',
                        width,
                        height,
                        signal: video.abortController.signal,
                      },
                    })
                  }}
                  clear={clearVideo}
                />
              ) : null)}
            <SubtitleDialogBtn
              defaultAltText={video.altText}
              saveAltText={altText =>
                dispatch({
                  type: 'embed_update_video',
                  videoAction: {
                    type: 'update_alt_text',
                    altText,
                    signal: video.abortController.signal,
                  },
                })
              }
              captions={video.captions}
              setCaptions={updater => {
                dispatch({
                  type: 'embed_update_video',
                  videoAction: {
                    type: 'update_captions',
                    updater,
                    signal: video.abortController.signal,
                  },
                })
              }}
            />
          </Animated.View>
        )}
      </LayoutAnimationConfig>

      <View style={!video ? [a.mt_md] : []}>
        {embed.quote?.uri ? (
          <View style={[s.mt5, s.mb2, isWeb && s.mb10]}>
            <View style={{pointerEvents: 'none'}}>
              <LazyQuoteEmbed uri={embed.quote.uri} />
            </View>
            {canRemoveQuote && (
              <QuoteX onRemove={() => dispatch({type: 'embed_remove_quote'})} />
            )}
          </View>
        ) : null}
      </View>
    </>
  )
}

function ComposerPills({
  isReply,
  thread,
  post,
  dispatch,
  bottomBarAnimatedStyle,
}: {
  isReply: boolean
  thread: ThreadDraft
  post: PostDraft
  dispatch: (action: ComposerAction) => void
  bottomBarAnimatedStyle: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const media = post.embed.media
  const hasMedia = media?.type === 'images' || media?.type === 'video'
  const hasLink = !!post.embed.link

  // Don't render anything if no pills are going to be displayed
  if (isReply && !hasMedia && !hasLink) {
    return null
  }

  return (
    <Animated.View
      style={[a.flex_row, a.p_sm, t.atoms.bg, bottomBarAnimatedStyle]}>
      <ScrollView
        contentContainerStyle={[a.gap_sm]}
        horizontal={true}
        bounces={false}
        showsHorizontalScrollIndicator={false}>
        {isReply ? null : (
          <ThreadgateBtn
            postgate={thread.postgate}
            onChangePostgate={nextPostgate => {
              dispatch({type: 'update_postgate', postgate: nextPostgate})
            }}
            threadgateAllowUISettings={thread.threadgate}
            onChangeThreadgateAllowUISettings={nextThreadgate => {
              dispatch({
                type: 'update_threadgate',
                threadgate: nextThreadgate,
              })
            }}
            style={bottomBarAnimatedStyle}
          />
        )}
        {hasMedia || hasLink ? (
          <LabelsBtn
            labels={post.labels}
            onChange={nextLabels => {
              dispatch({
                type: 'update_post',
                postAction: {
                  type: 'update_labels',
                  labels: nextLabels,
                },
              })
            }}
          />
        ) : null}
      </ScrollView>
    </Animated.View>
  )
}

function ComposerFooter({
  draft,
  dispatch,
  onEmojiButtonPress,
  onError,
  onSelectVideo,
}: {
  draft: PostDraft
  dispatch: (action: PostAction) => void
  onEmojiButtonPress: () => void
  onError: (error: string) => void
  onSelectVideo: (asset: ImagePickerAsset) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()

  const media = draft.embed.media
  const images = media?.type === 'images' ? media.images : []
  const video = media?.type === 'video' ? media.video : null
  const isMaxImages = images.length >= MAX_IMAGES

  const onImageAdd = useCallback(
    (next: ComposerImage[]) => {
      dispatch({
        type: 'embed_add_images',
        images: next,
      })
    },
    [dispatch],
  )

  const onSelectGif = useCallback(
    (gif: Gif) => {
      dispatch({type: 'embed_add_gif', gif})
    },
    [dispatch],
  )

  return (
    <View
      style={[
        a.flex_row,
        a.py_xs,
        {paddingLeft: 7, paddingRight: 16},
        a.align_center,
        a.border_t,
        t.atoms.bg,
        t.atoms.border_contrast_medium,
        a.justify_between,
      ]}>
      <View style={[a.flex_row, a.align_center]}>
        {video && video.status !== 'done' ? (
          <VideoUploadToolbar state={video} />
        ) : (
          <ToolbarWrapper style={[a.flex_row, a.align_center, a.gap_xs]}>
            <SelectPhotoBtn
              size={images.length}
              disabled={media?.type === 'images' ? isMaxImages : !!media}
              onAdd={onImageAdd}
            />
            <SelectVideoBtn
              onSelectVideo={onSelectVideo}
              disabled={!!media}
              setError={onError}
            />
            <OpenCameraBtn
              disabled={media?.type === 'images' ? isMaxImages : !!media}
              onAdd={onImageAdd}
            />
            <SelectGifBtn onSelectGif={onSelectGif} disabled={!!media} />
            {!isMobile ? (
              <Button
                onPress={onEmojiButtonPress}
                style={a.p_sm}
                label={_(msg`Open emoji picker`)}
                accessibilityHint={_(msg`Open emoji picker`)}
                variant="ghost"
                shape="round"
                color="primary">
                <EmojiSmile size="lg" />
              </Button>
            ) : null}
          </ToolbarWrapper>
        )}
      </View>
      <View style={[a.flex_row, a.align_center, a.justify_between]}>
        <SelectLangBtn />
        <CharProgress
          count={draft.shortenedGraphemeLength}
          style={{width: 65}}
        />
      </View>
    </View>
  )
}

export function useComposerCancelRef() {
  return useRef<CancelRef>(null)
}

function useAnimatedBorders() {
  const t = useTheme()
  const hasScrolledTop = useSharedValue(0)
  const hasScrolledBottom = useSharedValue(0)
  const contentOffset = useSharedValue(0)
  const scrollViewHeight = useSharedValue(Infinity)
  const contentHeight = useSharedValue(0)

  /**
   * Make sure to run this on the UI thread!
   */
  const showHideBottomBorder = useCallback(
    ({
      newContentHeight,
      newContentOffset,
      newScrollViewHeight,
    }: {
      newContentHeight?: number
      newContentOffset?: number
      newScrollViewHeight?: number
    }) => {
      'worklet'

      if (typeof newContentHeight === 'number')
        contentHeight.value = Math.floor(newContentHeight)
      if (typeof newContentOffset === 'number')
        contentOffset.value = Math.floor(newContentOffset)
      if (typeof newScrollViewHeight === 'number')
        scrollViewHeight.value = Math.floor(newScrollViewHeight)

      hasScrolledBottom.value = withTiming(
        contentHeight.value - contentOffset.value - 5 > scrollViewHeight.value
          ? 1
          : 0,
      )
    },
    [contentHeight, contentOffset, scrollViewHeight, hasScrolledBottom],
  )

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      'worklet'
      hasScrolledTop.value = withTiming(event.contentOffset.y > 0 ? 1 : 0)
      showHideBottomBorder({
        newContentOffset: event.contentOffset.y,
        newContentHeight: event.contentSize.height,
        newScrollViewHeight: event.layoutMeasurement.height,
      })
    },
  })

  const onScrollViewContentSizeChange = useCallback(
    (_width: number, height: number) => {
      'worklet'
      showHideBottomBorder({
        newContentHeight: height,
      })
    },
    [showHideBottomBorder],
  )

  const onScrollViewLayout = useCallback(
    (evt: LayoutChangeEvent) => {
      'worklet'
      showHideBottomBorder({
        newScrollViewHeight: evt.nativeEvent.layout.height,
      })
    },
    [showHideBottomBorder],
  )

  const topBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: interpolateColor(
        hasScrolledTop.value,
        [0, 1],
        ['transparent', t.atoms.border_contrast_medium.borderColor],
      ),
    }
  })
  const bottomBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: interpolateColor(
        hasScrolledBottom.value,
        [0, 1],
        ['transparent', t.atoms.border_contrast_medium.borderColor],
      ),
    }
  })

  return {
    scrollHandler,
    onScrollViewContentSizeChange,
    onScrollViewLayout,
    topBarAnimatedStyle,
    bottomBarAnimatedStyle,
  }
}

function useKeyboardVerticalOffset() {
  const {top} = useSafeAreaInsets()

  // Android etc
  if (!isIOS) return 0

  // iPhone SE
  if (top === 20) return 40

  // all other iPhones
  return top + 10
}

async function whenAppViewReady(
  agent: BskyAgent,
  uri: string,
  fn: (res: AppBskyFeedGetPostThread.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      agent.app.bsky.feed.getPostThread({
        uri,
        depth: 0,
      }),
  )
}

const styles = StyleSheet.create({
  topbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 54,
    gap: 4,
  },
  postBtn: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginLeft: 12,
  },
  errorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red1,
    borderRadius: 6,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  reminderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  errorIcon: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.red4,
    color: colors.red4,
    borderRadius: 30,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  textInputLayout: {
    flexDirection: 'row',
    paddingTop: 4,
  },
  textInputLayoutMobile: {
    flex: 1,
  },
  addExtLinkBtn: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginBottom: 4,
  },
})

function ErrorBanner({
  error: standardError,
  videoState,
  clearError,
  clearVideo,
}: {
  error: string
  videoState: VideoState | NoVideoState
  clearError: () => void
  clearVideo: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()

  const videoError =
    videoState.status === 'error' ? videoState.error : undefined
  const error = standardError || videoError

  const onClearError = () => {
    if (standardError) {
      clearError()
    } else {
      clearVideo()
    }
  }

  if (!error) return null

  return (
    <Animated.View
      style={[a.px_lg, a.pb_sm]}
      entering={FadeIn}
      exiting={FadeOut}>
      <View
        style={[
          a.px_md,
          a.py_sm,
          a.gap_xs,
          a.rounded_sm,
          t.atoms.bg_contrast_25,
        ]}>
        <View style={[a.relative, a.flex_row, a.gap_sm, {paddingRight: 48}]}>
          <CircleInfo fill={t.palette.negative_400} />
          <NewText style={[a.flex_1, a.leading_snug, {paddingTop: 1}]}>
            {error}
          </NewText>
          <Button
            label={_(msg`Dismiss error`)}
            size="tiny"
            color="secondary"
            variant="ghost"
            shape="round"
            style={[a.absolute, {top: 0, right: 0}]}
            onPress={onClearError}>
            <ButtonIcon icon={X} />
          </Button>
        </View>
        {videoError && videoState.jobId && (
          <NewText
            style={[
              {paddingLeft: 28},
              a.text_xs,
              a.font_bold,
              a.leading_snug,
              t.atoms.text_contrast_low,
            ]}>
            <Trans>Job ID: {videoState.jobId}</Trans>
          </NewText>
        )}
      </View>
    </Animated.View>
  )
}

function ToolbarWrapper({
  style,
  children,
}: {
  style: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  if (isWeb) return children
  return (
    <Animated.View
      style={style}
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(400)}>
      {children}
    </Animated.View>
  )
}

function VideoUploadToolbar({state}: {state: VideoState}) {
  const t = useTheme()
  const {_} = useLingui()
  const progress = state.progress
  const shouldRotate =
    state.status === 'processing' && (progress === 0 || progress === 1)
  let wheelProgress = shouldRotate ? 0.33 : progress

  const rotate = useDerivedValue(() => {
    if (shouldRotate) {
      return withRepeat(
        withTiming(360, {
          duration: 2500,
          easing: Easing.out(Easing.cubic),
        }),
        -1,
      )
    }
    return 0
  })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{rotateZ: `${rotate.value}deg`}],
    }
  })

  let text = ''

  switch (state.status) {
    case 'compressing':
      text = _(msg`Compressing video...`)
      break
    case 'uploading':
      text = _(msg`Uploading video...`)
      break
    case 'processing':
      text = _(msg`Processing video...`)
      break
    case 'error':
      text = _(msg`Error`)
      wheelProgress = 100
      break
    case 'done':
      text = _(msg`Video uploaded`)
      break
  }

  return (
    <ToolbarWrapper style={[a.flex_row, a.align_center, {paddingVertical: 5}]}>
      <Animated.View style={[animatedStyle]}>
        <ProgressCircle
          size={30}
          borderWidth={1}
          borderColor={t.atoms.border_contrast_low.borderColor}
          color={
            state.status === 'error'
              ? t.palette.negative_500
              : t.palette.primary_500
          }
          progress={wheelProgress}
        />
      </Animated.View>
      <NewText style={[a.font_bold, a.ml_sm]}>{text}</NewText>
    </ToolbarWrapper>
  )
}
