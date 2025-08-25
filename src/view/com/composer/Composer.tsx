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
  type LayoutChangeEvent,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'
// @ts-expect-error no type definition
import ProgressCircle from 'react-native-progress/Circle'
import Animated, {
  type AnimatedRef,
  Easing,
  FadeIn,
  FadeOut,
  interpolateColor,
  LayoutAnimationConfig,
  LinearTransition,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {type ImagePickerAsset} from 'expo-image-picker'
import {
  AppBskyFeedDefs,
  type AppBskyFeedGetPostThread,
  AppBskyUnspeccedDefs,
  type BskyAgent,
  type RichText,
} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import * as apilib from '#/lib/api/index'
import {EmbeddingDisabledError} from '#/lib/api/resolve'
import {retry} from '#/lib/async/retry'
import {until} from '#/lib/async/until'
import {
  MAX_GRAPHEME_LENGTH,
  SUPPORTED_MIME_TYPES,
  type SupportedMimeTypes,
} from '#/lib/constants'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {useAppState} from '#/lib/hooks/useAppState'
import {useIsKeyboardVisible} from '#/lib/hooks/useIsKeyboardVisible'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {mimeToExt} from '#/lib/media/video/util'
import {logEvent} from '#/lib/statsig/statsig'
import {cleanError} from '#/lib/strings/errors'
import {colors} from '#/lib/styles'
import {logger} from '#/logger'
import {isAndroid, isIOS, isNative, isWeb} from '#/platform/detection'
import {useDialogStateControlContext} from '#/state/dialogs'
import {emitPostCreated} from '#/state/events'
import {
  type ComposerImage,
  createComposerImage,
  pasteImage,
} from '#/state/gallery'
import {useModalControls} from '#/state/modals'
import {useRequireAltTextEnabled} from '#/state/preferences'
import {
  toPostLanguages,
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useProfileQuery} from '#/state/queries/profile'
import {type Gif} from '#/state/queries/tenor'
import {useAgent, useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell/composer'
import {type ComposerOpts, type OnPostSuccessData} from '#/state/shell/composer'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import {ComposerReplyTo} from '#/view/com/composer/ComposerReplyTo'
import {
  ExternalEmbedGif,
  ExternalEmbedLink,
} from '#/view/com/composer/ExternalEmbed'
import {ExternalEmbedRemoveBtn} from '#/view/com/composer/ExternalEmbedRemoveBtn'
import {GifAltTextDialog} from '#/view/com/composer/GifAltText'
import {LabelsBtn} from '#/view/com/composer/labels/LabelsBtn'
import {Gallery} from '#/view/com/composer/photos/Gallery'
import {OpenCameraBtn} from '#/view/com/composer/photos/OpenCameraBtn'
import {SelectGifBtn} from '#/view/com/composer/photos/SelectGifBtn'
import {SelectLangBtn} from '#/view/com/composer/select-language/SelectLangBtn'
import {SuggestedLanguage} from '#/view/com/composer/select-language/SuggestedLanguage'
// TODO: Prevent naming components that coincide with RN primitives
// due to linting false positives
import {
  TextInput,
  type TextInputRef,
} from '#/view/com/composer/text-input/TextInput'
import {ThreadgateBtn} from '#/view/com/composer/threadgate/ThreadgateBtn'
import {SubtitleDialogBtn} from '#/view/com/composer/videos/SubtitleDialog'
import {VideoPreview} from '#/view/com/composer/videos/VideoPreview'
import {VideoTranscodeProgress} from '#/view/com/composer/videos/VideoTranscodeProgress'
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {EmojiArc_Stroke2_Corner0_Rounded as EmojiSmile} from '#/components/icons/Emoji'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {LazyQuoteEmbed} from '#/components/Post/Embed/LazyQuoteEmbed'
import * as Prompt from '#/components/Prompt'
import * as toast from '#/components/Toast'
import {Text as NewText} from '#/components/Typography'
import {BottomSheetPortalProvider} from '../../../../modules/bottom-sheet'
import {
  type AssetType,
  SelectMediaButton,
  type SelectMediaButtonProps,
} from './SelectMediaButton'
import {
  type ComposerAction,
  composerReducer,
  createComposerState,
  type EmbedDraft,
  MAX_IMAGES,
  type PostAction,
  type PostDraft,
  type ThreadDraft,
} from './state/composer'
import {
  NO_VIDEO,
  type NoVideoState,
  processVideo,
  type VideoState,
} from './state/video'
import {getVideoMetadata} from './videos/pickVideo'
import {clearThumbnailCache} from './videos/VideoTranscodeBackdrop'

type CancelRef = {
  onPressCancel: () => void
}

type Props = ComposerOpts
export const ComposePost = ({
  replyTo,
  onPost,
  onPostSuccess,
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
  const {data: preferences} = usePreferencesQuery()

  const [isKeyboardVisible] = useIsKeyboardVisible({iosUseWillEvents: true})
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishingStage, setPublishingStage] = useState('')
  const [error, setError] = useState('')

  const [composerState, composerDispatch] = useReducer(
    composerReducer,
    {
      initImageUris,
      initQuoteUri: initQuote?.uri,
      initText,
      initMention,
      initInteractionSettings: preferences?.postInteractionSettings,
    },
    createComposerState,
  )

  const thread = composerState.thread
  const activePost = thread.posts[composerState.activePostIndex]
  const nextPost: PostDraft | undefined =
    thread.posts[composerState.activePostIndex + 1]
  const dispatch = useCallback(
    (postAction: PostAction) => {
      composerDispatch({
        type: 'update_post',
        postId: activePost.id,
        postAction,
      })
    },
    [activePost.id],
  )

  const selectVideo = React.useCallback(
    (postId: string, asset: ImagePickerAsset) => {
      const abortController = new AbortController()
      composerDispatch({
        type: 'update_post',
        postId: postId,
        postAction: {
          type: 'embed_add_video',
          asset,
          abortController,
        },
      })
      processVideo(
        asset,
        videoAction => {
          composerDispatch({
            type: 'update_post',
            postId: postId,
            postAction: {
              type: 'embed_update_video',
              videoAction,
            },
          })
        },
        agent,
        currentDid,
        abortController.signal,
        _,
      )
    },
    [_, agent, currentDid, composerDispatch],
  )

  const onInitVideo = useNonReactiveCallback(() => {
    if (initVideoUri) {
      selectVideo(activePost.id, initVideoUri)
    }
  })

  useEffect(() => {
    onInitVideo()
  }, [onInitVideo])

  const clearVideo = React.useCallback(
    (postId: string) => {
      composerDispatch({
        type: 'update_post',
        postId: postId,
        postAction: {
          type: 'embed_remove_video',
        },
      })
    },
    [composerDispatch],
  )

  const [publishOnUpload, setPublishOnUpload] = useState(false)

  const onClose = useCallback(() => {
    closeComposer()
    clearThumbnailCache(queryClient)
  }, [closeComposer, queryClient])

  const insets = useSafeAreaInsets()
  const viewStyles = useMemo(
    () => ({
      paddingTop: isAndroid ? insets.top : 0,
      paddingBottom:
        // iOS - when keyboard is closed, keep the bottom bar in the safe area
        (isIOS && !isKeyboardVisible) ||
        // Android - Android >=35 KeyboardAvoidingView adds double padding when
        // keyboard is closed, so we subtract that in the offset and add it back
        // here when the keyboard is open
        (isAndroid && isKeyboardVisible)
          ? insets.bottom
          : 0,
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

  const missingAltError = useMemo(() => {
    if (!requireAltTextEnabled) {
      return
    }
    for (let i = 0; i < thread.posts.length; i++) {
      const media = thread.posts[i].embed.media
      if (media) {
        if (media.type === 'images' && media.images.some(img => !img.alt)) {
          return _(msg`One or more images is missing alt text.`)
        }
        if (media.type === 'gif' && !media.alt) {
          return _(msg`One or more GIFs is missing alt text.`)
        }
        if (
          media.type === 'video' &&
          media.video.status !== 'error' &&
          !media.video.altText
        ) {
          return _(msg`One or more videos is missing alt text.`)
        }
      }
    }
  }, [thread, requireAltTextEnabled, _])

  const canPost =
    !missingAltError &&
    thread.posts.every(
      post =>
        post.shortenedGraphemeLength <= MAX_GRAPHEME_LENGTH &&
        !isEmptyPost(post) &&
        !(
          post.embed.media?.type === 'video' &&
          post.embed.media.video.status === 'error'
        ),
    )

  const onPressPublish = React.useCallback(async () => {
    if (isPublishing) {
      return
    }

    if (!canPost) {
      return
    }

    if (
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

    let postUri: string | undefined
    let postSuccessData: OnPostSuccessData
    try {
      logger.info(`composer: posting...`)
      postUri = (
        await apilib.post(agent, queryClient, {
          thread,
          replyTo: replyTo?.uri,
          onStateChange: setPublishingStage,
          langs: toPostLanguages(langPrefs.postLanguage),
        })
      ).uris[0]

      /*
       * Wait for app view to have received the post(s). If this fails, it's
       * ok, because the post _was_ actually published above.
       */
      try {
        if (postUri) {
          logger.info(`composer: waiting for app view`)

          const posts = await retry(
            5,
            _e => true,
            async () => {
              const res = await agent.app.bsky.unspecced.getPostThreadV2({
                anchor: postUri!,
                above: false,
                below: thread.posts.length - 1,
                branchingFactor: 1,
              })
              if (res.data.thread.length !== thread.posts.length) {
                throw new Error(`composer: app view is not ready`)
              }
              if (
                !res.data.thread.every(p =>
                  AppBskyUnspeccedDefs.isThreadItemPost(p.value),
                )
              ) {
                throw new Error(`composer: app view returned non-post items`)
              }
              return res.data.thread
            },
            1e3,
          )
          postSuccessData = {
            replyToUri: replyTo?.uri,
            posts,
          }
        }
      } catch (waitErr: any) {
        logger.info(`composer: waiting for app view failed`, {
          safeMessage: waitErr,
        })
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
            isPartOfThread: thread.posts.length > 1,
            hasLink: !!post.embed.link,
            hasQuote: !!post.embed.quote,
            langs: langPrefs.postLanguage,
            logContext: 'Composer',
          })
          index++
        }
      }
      if (thread.posts.length > 1) {
        logEvent('thread:create', {
          postCount: thread.posts.length,
          isReply: !!replyTo,
        })
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
          onPostSuccess?.(postSuccessData)
          return true
        }
        return false
      })
    } else {
      onPost?.(postUri)
      onPostSuccess?.(postSuccessData)
    }
    onClose()
    toast.show(
      thread.posts.length > 1
        ? _(msg`Your posts have been published`)
        : replyTo
          ? _(msg`Your reply has been published`)
          : _(msg`Your post has been published`),
      {type: 'success'},
    )
  }, [
    _,
    agent,
    thread,
    canPost,
    isPublishing,
    langPrefs.postLanguage,
    onClose,
    onPost,
    onPostSuccess,
    initQuote,
    replyTo,
    setLangPrefs,
    queryClient,
  ])

  // Preserves the referential identity passed to each post item.
  // Avoids re-rendering all posts on each keystroke.
  const onComposerPostPublish = useNonReactiveCallback(() => {
    onPressPublish()
  })

  React.useEffect(() => {
    if (publishOnUpload) {
      let erroredVideos = 0
      let uploadingVideos = 0
      for (let post of thread.posts) {
        if (post.embed.media?.type === 'video') {
          const video = post.embed.media.video
          if (video.status === 'error') {
            erroredVideos++
          } else if (video.status !== 'done') {
            uploadingVideos++
          }
        }
      }
      if (erroredVideos > 0) {
        setPublishOnUpload(false)
      } else if (uploadingVideos === 0) {
        setPublishOnUpload(false)
        onPressPublish()
      }
    }
  }, [thread.posts, onPressPublish, publishOnUpload])

  // TODO: It might make more sense to display this error per-post.
  // Right now we're just displaying the first one.
  let erroredVideoPostId: string | undefined
  let erroredVideo: VideoState | NoVideoState = NO_VIDEO
  for (let i = 0; i < thread.posts.length; i++) {
    const post = thread.posts[i]
    if (
      post.embed.media?.type === 'video' &&
      post.embed.media.video.status === 'error'
    ) {
      erroredVideoPostId = post.id
      erroredVideo = post.embed.media.video
      break
    }
  }

  const onEmojiButtonPress = useCallback(() => {
    const rect = textInput.current?.getCursorPosition()
    if (rect) {
      openEmojiPicker?.({
        ...rect,
        nextFocusRef:
          textInput as unknown as React.MutableRefObject<HTMLElement>,
      })
    }
  }, [openEmojiPicker])

  const scrollViewRef = useAnimatedRef<Animated.ScrollView>()
  useEffect(() => {
    if (composerState.mutableNeedsFocusActive) {
      composerState.mutableNeedsFocusActive = false
      // On Android, this risks getting the cursor stuck behind the keyboard.
      // Not worth it.
      if (!isAndroid) {
        textInput.current?.focus()
      }
    }
  }, [composerState])

  const isLastThreadedPost = thread.posts.length > 1 && nextPost === undefined
  const {
    scrollHandler,
    onScrollViewContentSizeChange,
    onScrollViewLayout,
    topBarAnimatedStyle,
    bottomBarAnimatedStyle,
  } = useScrollTracker({
    scrollViewRef,
    stickyBottom: isLastThreadedPost,
  })

  const keyboardVerticalOffset = useKeyboardVerticalOffset()

  const footer = (
    <>
      <SuggestedLanguage
        text={activePost.richtext.text}
        // NOTE(@elijaharita): currently just choosing the first language if any exists
        replyToLanguage={replyTo?.langs?.[0]}
      />
      <ComposerPills
        isReply={!!replyTo}
        post={activePost}
        thread={composerState.thread}
        dispatch={composerDispatch}
        bottomBarAnimatedStyle={bottomBarAnimatedStyle}
      />
      <ComposerFooter
        post={activePost}
        dispatch={dispatch}
        showAddButton={
          !isEmptyPost(activePost) && (!nextPost || !isEmptyPost(nextPost))
        }
        onError={setError}
        onEmojiButtonPress={onEmojiButtonPress}
        onSelectVideo={selectVideo}
        onAddPost={() => {
          composerDispatch({
            type: 'add_post',
          })
        }}
      />
    </>
  )

  const isWebFooterSticky = !isNative && thread.posts.length > 1
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
            isPublishQueued={publishOnUpload}
            isPublishing={isPublishing}
            isThread={thread.posts.length > 1}
            publishingStage={publishingStage}
            topBarAnimatedStyle={topBarAnimatedStyle}
            onCancel={onPressCancel}
            onPublish={onPressPublish}>
            {missingAltError && <AltTextReminder error={missingAltError} />}
            <ErrorBanner
              error={error}
              videoState={erroredVideo}
              clearError={() => setError('')}
              clearVideo={
                erroredVideoPostId
                  ? () => clearVideo(erroredVideoPostId)
                  : () => {}
              }
            />
          </ComposerTopBar>

          <Animated.ScrollView
            ref={scrollViewRef}
            layout={native(LinearTransition)}
            onScroll={scrollHandler}
            contentContainerStyle={a.flex_grow}
            style={a.flex_1}
            keyboardShouldPersistTaps="always"
            onContentSizeChange={onScrollViewContentSizeChange}
            onLayout={onScrollViewLayout}>
            {replyTo ? <ComposerReplyTo replyTo={replyTo} /> : undefined}
            {thread.posts.map((post, index) => (
              <React.Fragment key={post.id}>
                <ComposerPost
                  post={post}
                  dispatch={composerDispatch}
                  textInput={post.id === activePost.id ? textInput : null}
                  isFirstPost={index === 0}
                  isLastPost={index === thread.posts.length - 1}
                  isPartOfThread={thread.posts.length > 1}
                  isReply={index > 0 || !!replyTo}
                  isActive={post.id === activePost.id}
                  canRemovePost={thread.posts.length > 1}
                  canRemoveQuote={index > 0 || !initQuote}
                  onSelectVideo={selectVideo}
                  onClearVideo={clearVideo}
                  onPublish={onComposerPostPublish}
                  onError={setError}
                />
                {isWebFooterSticky && post.id === activePost.id && (
                  <View style={styles.stickyFooterWeb}>{footer}</View>
                )}
              </React.Fragment>
            ))}
          </Animated.ScrollView>
          {!isWebFooterSticky && footer}
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

let ComposerPost = React.memo(function ComposerPost({
  post,
  dispatch,
  textInput,
  isActive,
  isReply,
  isFirstPost,
  isLastPost,
  isPartOfThread,
  canRemovePost,
  canRemoveQuote,
  onClearVideo,
  onSelectVideo,
  onError,
  onPublish,
}: {
  post: PostDraft
  dispatch: (action: ComposerAction) => void
  textInput: React.Ref<TextInputRef>
  isActive: boolean
  isReply: boolean
  isFirstPost: boolean
  isLastPost: boolean
  isPartOfThread: boolean
  canRemovePost: boolean
  canRemoveQuote: boolean
  onClearVideo: (postId: string) => void
  onSelectVideo: (postId: string, asset: ImagePickerAsset) => void
  onError: (error: string) => void
  onPublish: (richtext: RichText) => void
}) {
  const {currentAccount} = useSession()
  const currentDid = currentAccount!.did
  const {_} = useLingui()
  const {data: currentProfile} = useProfileQuery({did: currentDid})
  const richtext = post.richtext
  const isTextOnly = !post.embed.link && !post.embed.quote && !post.embed.media
  const forceMinHeight = isWeb && isTextOnly && isActive
  const selectTextInputPlaceholder = isReply
    ? isFirstPost
      ? _(msg`Write your reply`)
      : _(msg`Add another post`)
    : _(msg`What's up?`)
  const discardPromptControl = Prompt.usePromptControl()

  const dispatchPost = useCallback(
    (action: PostAction) => {
      dispatch({
        type: 'update_post',
        postId: post.id,
        postAction: action,
      })
    },
    [dispatch, post.id],
  )

  const onImageAdd = useCallback(
    (next: ComposerImage[]) => {
      dispatchPost({
        type: 'embed_add_images',
        images: next,
      })
    },
    [dispatchPost],
  )

  const onNewLink = useCallback(
    (uri: string) => {
      dispatchPost({type: 'embed_add_uri', uri})
    },
    [dispatchPost],
  )

  const onPhotoPasted = useCallback(
    async (uri: string) => {
      if (
        uri.startsWith('data:video/') ||
        (isWeb && uri.startsWith('data:image/gif'))
      ) {
        if (isNative) return // web only
        const [mimeType] = uri.slice('data:'.length).split(';')
        if (!SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeTypes)) {
          toast.show(_(msg`Unsupported video type: ${mimeType}`), {
            type: 'error',
          })
          return
        }
        const name = `pasted.${mimeToExt(mimeType)}`
        const file = await fetch(uri)
          .then(res => res.blob())
          .then(blob => new File([blob], name, {type: mimeType}))
        onSelectVideo(post.id, await getVideoMetadata(file))
      } else {
        const res = await pasteImage(uri)
        onImageAdd([res])
      }
    },
    [post.id, onSelectVideo, onImageAdd, _],
  )

  useHideKeyboardOnBackground()

  return (
    <View
      style={[
        a.mx_lg,
        a.mb_sm,
        !isActive && isLastPost && a.mb_lg,
        !isActive && styles.inactivePost,
        isTextOnly && isNative && a.flex_grow,
      ]}>
      <View style={[a.flex_row, isNative && a.flex_1]}>
        <UserAvatar
          avatar={currentProfile?.avatar}
          size={42}
          type={currentProfile?.associated?.labeler ? 'labeler' : 'user'}
          style={[a.mt_xs]}
        />
        <TextInput
          ref={textInput}
          style={[a.pt_xs]}
          richtext={richtext}
          placeholder={selectTextInputPlaceholder}
          autoFocus
          webForceMinHeight={forceMinHeight}
          // To avoid overlap with the close button:
          hasRightPadding={isPartOfThread}
          isActive={isActive}
          setRichText={rt => {
            dispatchPost({type: 'update_richtext', richtext: rt})
          }}
          onFocus={() => {
            dispatch({
              type: 'focus_post',
              postId: post.id,
            })
          }}
          onPhotoPasted={onPhotoPasted}
          onNewLink={onNewLink}
          onError={onError}
          onPressPublish={onPublish}
          accessible={true}
          accessibilityLabel={_(msg`Write post`)}
          accessibilityHint={_(
            msg`Compose posts up to ${plural(MAX_GRAPHEME_LENGTH || 0, {
              other: '# characters',
            })} in length`,
          )}
        />
      </View>

      {canRemovePost && isActive && (
        <>
          <Button
            label={_(msg`Delete post`)}
            size="small"
            color="secondary"
            variant="ghost"
            shape="round"
            style={[a.absolute, {top: 0, right: 0}]}
            onPress={() => {
              if (
                post.shortenedGraphemeLength > 0 ||
                post.embed.media ||
                post.embed.link ||
                post.embed.quote
              ) {
                discardPromptControl.open()
              } else {
                dispatch({
                  type: 'remove_post',
                  postId: post.id,
                })
              }
            }}>
            <ButtonIcon icon={X} />
          </Button>
          <Prompt.Basic
            control={discardPromptControl}
            title={_(msg`Discard post?`)}
            description={_(msg`Are you sure you'd like to discard this post?`)}
            onConfirm={() => {
              dispatch({
                type: 'remove_post',
                postId: post.id,
              })
            }}
            confirmButtonCta={_(msg`Discard`)}
            confirmButtonColor="negative"
          />
        </>
      )}

      <ComposerEmbeds
        canRemoveQuote={canRemoveQuote}
        embed={post.embed}
        dispatch={dispatchPost}
        clearVideo={() => onClearVideo(post.id)}
        isActivePost={isActive}
      />
    </View>
  )
})

function ComposerTopBar({
  canPost,
  isReply,
  isPublishQueued,
  isPublishing,
  isThread,
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
  isThread: boolean
  onCancel: () => void
  onPublish: () => void
  topBarAnimatedStyle: StyleProp<ViewStyle>
  children?: React.ReactNode
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  return (
    <Animated.View
      style={topBarAnimatedStyle}
      layout={native(LinearTransition)}>
      <View style={styles.topbarInner}>
        <Button
          label={_(msg`Cancel`)}
          variant="ghost"
          color="primary"
          shape="default"
          size="small"
          style={[a.rounded_full, a.py_sm, {paddingLeft: 7, paddingRight: 7}]}
          onPress={onCancel}
          accessibilityHint={_(
            msg`Closes post composer and discards post draft`,
          )}>
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
            label={
              isReply
                ? isThread
                  ? _(
                      msg({
                        message: 'Publish replies',
                        comment:
                          'Accessibility label for button to publish multiple replies in a thread',
                      }),
                    )
                  : _(
                      msg({
                        message: 'Publish reply',
                        comment:
                          'Accessibility label for button to publish a single reply',
                      }),
                    )
                : isThread
                  ? _(
                      msg({
                        message: 'Publish posts',
                        comment:
                          'Accessibility label for button to publish multiple posts in a thread',
                      }),
                    )
                  : _(
                      msg({
                        message: 'Publish post',
                        comment:
                          'Accessibility label for button to publish a single post',
                      }),
                    )
            }
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
              ) : isThread ? (
                <Trans context="action">Post All</Trans>
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

function AltTextReminder({error}: {error: string}) {
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
      <Text style={[pal.text, a.flex_1]}>{error}</Text>
    </View>
  )
}

function ComposerEmbeds({
  embed,
  dispatch,
  clearVideo,
  canRemoveQuote,
  isActivePost,
}: {
  embed: EmbedDraft
  dispatch: (action: PostAction) => void
  clearVideo: () => void
  canRemoveQuote: boolean
  isActivePost: boolean
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
                  isActivePost={isActivePost}
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
      {embed.quote?.uri ? (
        <View
          style={[a.pb_sm, video ? [a.pt_md] : [a.pt_xl], isWeb && [a.pb_md]]}>
          <View style={[a.relative]}>
            <View style={{pointerEvents: 'none'}}>
              <LazyQuoteEmbed uri={embed.quote.uri} />
            </View>
            {canRemoveQuote && (
              <ExternalEmbedRemoveBtn
                onRemove={() => dispatch({type: 'embed_remove_quote'})}
                style={{top: 16}}
              />
            )}
          </View>
        </View>
      ) : null}
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
        keyboardShouldPersistTaps="always"
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
                postId: post.id,
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
  post,
  dispatch,
  showAddButton,
  onEmojiButtonPress,
  onSelectVideo,
  onAddPost,
}: {
  post: PostDraft
  dispatch: (action: PostAction) => void
  showAddButton: boolean
  onEmojiButtonPress: () => void
  onError: (error: string) => void
  onSelectVideo: (postId: string, asset: ImagePickerAsset) => void
  onAddPost: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()
  /*
   * Once we've allowed a certain type of asset to be selected, we don't allow
   * other types of media to be selected.
   */
  const [selectedAssetsType, setSelectedAssetsType] = useState<
    AssetType | undefined
  >(undefined)

  const media = post.embed.media
  const images = media?.type === 'images' ? media.images : []
  const video = media?.type === 'video' ? media.video : null
  const isMaxImages = images.length >= MAX_IMAGES
  const isMaxVideos = !!video

  let selectedAssetsCount = 0
  let isMediaSelectionDisabled = false

  if (media?.type === 'images') {
    isMediaSelectionDisabled = isMaxImages
    selectedAssetsCount = images.length
  } else if (media?.type === 'video') {
    isMediaSelectionDisabled = isMaxVideos
    selectedAssetsCount = 1
  } else {
    isMediaSelectionDisabled = !!media
  }

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

  /*
   * Reset if the user clears any selected media
   */
  if (selectedAssetsType !== undefined && !media) {
    setSelectedAssetsType(undefined)
  }

  const onSelectAssets = useCallback<SelectMediaButtonProps['onSelectAssets']>(
    async ({type, assets, errors}) => {
      setSelectedAssetsType(type)

      if (assets.length) {
        if (type === 'image') {
          const images: ComposerImage[] = []

          await Promise.all(
            assets.map(async image => {
              const composerImage = await createComposerImage({
                path: image.uri,
                width: image.width,
                height: image.height,
                mime: image.mimeType!,
              })
              images.push(composerImage)
            }),
          ).catch(e => {
            logger.error(`createComposerImage failed`, {
              safeMessage: e.message,
            })
          })

          onImageAdd(images)
        } else if (type === 'video') {
          onSelectVideo(post.id, assets[0])
        } else if (type === 'gif') {
          onSelectVideo(post.id, assets[0])
        }
      }

      errors.map(error => {
        toast.show(error, {
          type: 'warning',
        })
      })
    },
    [post.id, onSelectVideo, onImageAdd],
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
        <LayoutAnimationConfig skipEntering skipExiting>
          {video && video.status !== 'done' ? (
            <VideoUploadToolbar state={video} />
          ) : (
            <ToolbarWrapper style={[a.flex_row, a.align_center, a.gap_xs]}>
              <SelectMediaButton
                disabled={isMediaSelectionDisabled}
                allowedAssetTypes={selectedAssetsType}
                selectedAssetsCount={selectedAssetsCount}
                onSelectAssets={onSelectAssets}
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
                  accessibilityHint={_(msg`Opens emoji picker`)}
                  variant="ghost"
                  shape="round"
                  color="primary">
                  <EmojiSmile size="lg" />
                </Button>
              ) : null}
            </ToolbarWrapper>
          )}
        </LayoutAnimationConfig>
      </View>
      <View style={[a.flex_row, a.align_center, a.justify_between]}>
        {showAddButton && (
          <Button
            label={_(msg`Add new post`)}
            onPress={onAddPost}
            style={[a.p_sm, a.m_2xs]}
            variant="ghost"
            shape="round"
            color="primary">
            <FontAwesomeIcon
              icon="add"
              size={20}
              color={t.palette.primary_500}
            />
          </Button>
        )}
        <SelectLangBtn />
        <CharProgress
          count={post.shortenedGraphemeLength}
          style={{width: 65}}
        />
      </View>
    </View>
  )
}

export function useComposerCancelRef() {
  return useRef<CancelRef>(null)
}

function useScrollTracker({
  scrollViewRef,
  stickyBottom,
}: {
  scrollViewRef: AnimatedRef<Animated.ScrollView>
  stickyBottom: boolean
}) {
  const t = useTheme()
  const contentOffset = useSharedValue(0)
  const scrollViewHeight = useSharedValue(Infinity)
  const contentHeight = useSharedValue(0)

  const hasScrolledToTop = useDerivedValue(() =>
    withTiming(contentOffset.get() === 0 ? 1 : 0),
  )

  const hasScrolledToBottom = useDerivedValue(() =>
    withTiming(
      contentHeight.get() - contentOffset.get() - 5 <= scrollViewHeight.get()
        ? 1
        : 0,
    ),
  )

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
        contentHeight.set(Math.floor(newContentHeight))
      if (typeof newContentOffset === 'number')
        contentOffset.set(Math.floor(newContentOffset))
      if (typeof newScrollViewHeight === 'number')
        scrollViewHeight.set(Math.floor(newScrollViewHeight))
    },
    [contentHeight, contentOffset, scrollViewHeight],
  )

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      'worklet'
      showHideBottomBorder({
        newContentOffset: event.contentOffset.y,
        newContentHeight: event.contentSize.height,
        newScrollViewHeight: event.layoutMeasurement.height,
      })
    },
  })

  const onScrollViewContentSizeChangeUIThread = useCallback(
    (newContentHeight: number) => {
      'worklet'
      const oldContentHeight = contentHeight.get()
      let shouldScrollToBottom = false
      if (stickyBottom && newContentHeight > oldContentHeight) {
        const isFairlyCloseToBottom =
          oldContentHeight - contentOffset.get() - 100 <= scrollViewHeight.get()
        if (isFairlyCloseToBottom) {
          shouldScrollToBottom = true
        }
      }
      showHideBottomBorder({newContentHeight})
      if (shouldScrollToBottom) {
        scrollTo(scrollViewRef, 0, newContentHeight, true)
      }
    },
    [
      showHideBottomBorder,
      scrollViewRef,
      contentHeight,
      stickyBottom,
      contentOffset,
      scrollViewHeight,
    ],
  )

  const onScrollViewContentSizeChange = useCallback(
    (_width: number, height: number) => {
      runOnUI(onScrollViewContentSizeChangeUIThread)(height)
    },
    [onScrollViewContentSizeChangeUIThread],
  )

  const onScrollViewLayout = useCallback(
    (evt: LayoutChangeEvent) => {
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
        hasScrolledToTop.get(),
        [0, 1],
        [t.atoms.border_contrast_medium.borderColor, 'transparent'],
      ),
    }
  })
  const bottomBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: interpolateColor(
        hasScrolledToBottom.get(),
        [0, 1],
        [t.atoms.border_contrast_medium.borderColor, 'transparent'],
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
  const {top, bottom} = useSafeAreaInsets()

  // Android etc
  if (!isIOS) {
    // need to account for the edge-to-edge nav bar
    return bottom * -1
  }

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

function isEmptyPost(post: PostDraft) {
  return (
    post.richtext.text.trim().length === 0 &&
    !post.embed.media &&
    !post.embed.link &&
    !post.embed.quote
  )
}

function useHideKeyboardOnBackground() {
  const appState = useAppState()

  useEffect(() => {
    if (isIOS) {
      if (appState === 'inactive') {
        Keyboard.dismiss()
      }
    }
  }, [appState])
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
  stickyFooterWeb: web({
    position: 'sticky',
    bottom: 0,
  }),
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
  inactivePost: {
    opacity: 0.5,
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
      transform: [{rotateZ: `${rotate.get()}deg`}],
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
