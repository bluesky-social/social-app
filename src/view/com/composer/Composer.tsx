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
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import * as FileSystem from 'expo-file-system'
import {type ImagePickerAsset} from 'expo-image-picker'
import {
  AppBskyUnspeccedDefs,
  type AppBskyUnspeccedGetPostThreadV2,
  AtUri,
  type BskyAgent,
  type RichText,
} from '@atproto/api'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import * as apilib from '#/lib/api/index'
import {EmbeddingDisabledError} from '#/lib/api/resolve'
import {useAppState} from '#/lib/appState'
import {retry} from '#/lib/async/retry'
import {until} from '#/lib/async/until'
import {
  MAX_GRAPHEME_LENGTH,
  SUPPORTED_MIME_TYPES,
  type SupportedMimeTypes,
} from '#/lib/constants'
import {useIsKeyboardVisible} from '#/lib/hooks/useIsKeyboardVisible'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {mimeToExt} from '#/lib/media/video/util'
import {useCallOnce} from '#/lib/once'
import {type NavigationProp} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {colors} from '#/lib/styles'
import {logger} from '#/logger'
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
  fromPostLanguages,
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
import {DraftsButton} from '#/view/com/composer/drafts/DraftsButton'
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
import {SuggestedLanguage} from '#/view/com/composer/select-language/SuggestedLanguage'
// TODO: Prevent naming components that coincide with RN primitives
// due to linting false positives
import {TextInput} from '#/view/com/composer/text-input/TextInput'
import {ThreadgateBtn} from '#/view/com/composer/threadgate/ThreadgateBtn'
import {SubtitleDialogBtn} from '#/view/com/composer/videos/SubtitleDialog'
import {VideoPreview} from '#/view/com/composer/videos/VideoPreview'
import {VideoTranscodeProgress} from '#/view/com/composer/videos/VideoTranscodeProgress'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {EmojiArc_Stroke2_Corner0_Rounded as EmojiSmileIcon} from '#/components/icons/Emoji'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {LazyQuoteEmbed} from '#/components/Post/Embed/LazyQuoteEmbed'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_ANDROID, IS_IOS, IS_NATIVE, IS_WEB} from '#/env'
import {BottomSheetPortalProvider} from '../../../../modules/bottom-sheet'
import {
  draftToComposerPosts,
  extractLocalRefs,
  type RestoredVideo,
} from './drafts/state/api'
import {
  loadDraftMedia,
  useCleanupPublishedDraftMutation,
  useSaveDraftMutation,
} from './drafts/state/queries'
import {type DraftSummary} from './drafts/state/schema'
import {revokeAllMediaUrls} from './drafts/state/storage'
import {PostLanguageSelect} from './select-language/PostLanguageSelect'
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
import {type TextInputRef} from './text-input/TextInput.types'
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
  openGallery,
  logContext,
  cancelRef,
}: Props & {
  cancelRef?: React.RefObject<CancelRef | null>
}) => {
  const {currentAccount} = useSession()
  const ax = useAnalytics()
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
  const {mutateAsync: saveDraft, isPending: _isSavingDraft} =
    useSaveDraftMutation()
  const {mutate: cleanupPublishedDraft} = useCleanupPublishedDraftMutation()
  const {closeAllDialogs} = useDialogStateControlContext()
  const {closeAllModals} = useModalControls()
  const {data: preferences} = usePreferencesQuery()
  const navigation = useNavigation<NavigationProp>()

  const [isKeyboardVisible] = useIsKeyboardVisible({iosUseWillEvents: true})
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishingStage, setPublishingStage] = useState('')
  const [error, setError] = useState('')

  /**
   * Track when a draft was created so we can measure draft age in metrics.
   * Set when a draft is loaded via handleSelectDraft.
   */
  const [loadedDraftCreatedAt, setLoadedDraftCreatedAt] = useState<
    string | null
  >(null)

  /**
   * A temporary local reference to a language suggestion that the user has
   * accepted. This overrides the global post language preference, but is not
   * stored permanently.
   */
  const [acceptedLanguageSuggestion, setAcceptedLanguageSuggestion] = useState<
    string | null
  >(null)

  /**
   * The language(s) of the post being replied to.
   */
  const [replyToLanguages, setReplyToLanguages] = useState<string[]>(
    replyTo?.langs || [],
  )

  /**
   * The currently selected languages of the post. Prefer local temporary
   * language suggestion over global lang prefs, if available.
   */
  const currentLanguages = useMemo(
    () =>
      acceptedLanguageSuggestion
        ? [acceptedLanguageSuggestion]
        : toPostLanguages(langPrefs.postLanguage),
    [acceptedLanguageSuggestion, langPrefs.postLanguage],
  )

  /**
   * When the user selects a language from the composer language selector,
   * clear any temporary language suggestions they may have selected
   * previously, and any we might try to suggest to them.
   */
  const onSelectLanguage = () => {
    setAcceptedLanguageSuggestion(null)
    setReplyToLanguages([])
  }

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

  // Fire composer:open metric on mount
  useCallOnce(() => {
    ax.metric('composer:open', {
      logContext: logContext ?? 'Other',
      isReply: !!replyTo,
      hasQuote: !!initQuote,
      hasDraft: false,
    })
  })()

  const clearVideo = useCallback(
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

  const restoreVideo = useCallback(
    async (postId: string, videoInfo: RestoredVideo) => {
      try {
        logger.debug('restoring video from draft', {
          postId,
          videoUri: videoInfo.uri,
          altText: videoInfo.altText,
          captionCount: videoInfo.captions.length,
        })

        let asset: ImagePickerAsset

        if (IS_WEB) {
          // Web: Convert blob URL to a File, then get video metadata (returns data URL)
          const response = await fetch(videoInfo.uri)
          const blob = await response.blob()
          const file = new File([blob], 'restored-video', {
            type: videoInfo.mimeType,
          })
          asset = await getVideoMetadata(file)
        } else {
          let uri = videoInfo.uri
          if (IS_ANDROID) {
            // Android: expo-file-system double-encodes filenames with special chars.
            // The file exists, but react-native-compressor's MediaMetadataRetriever
            // can't handle the double-encoded URI. Copy to a temp file with a simple name.
            const sourceFile = new FileSystem.File(videoInfo.uri)
            const tempFileName = `draft-video-${Date.now()}.${mimeToExt(videoInfo.mimeType)}`
            const tempFile = new FileSystem.File(
              FileSystem.Paths.cache,
              tempFileName,
            )
            sourceFile.copy(tempFile)
            logger.debug('restoreVideo: copied to temp file', {
              source: videoInfo.uri,
              temp: tempFile.uri,
            })
            uri = tempFile.uri
          }
          asset = await getVideoMetadata(uri)
        }

        // Start video processing using existing flow
        const abortController = new AbortController()
        composerDispatch({
          type: 'update_post',
          postId,
          postAction: {
            type: 'embed_add_video',
            asset,
            abortController,
          },
        })

        // Restore alt text immediately
        if (videoInfo.altText) {
          composerDispatch({
            type: 'update_post',
            postId,
            postAction: {
              type: 'embed_update_video',
              videoAction: {
                type: 'update_alt_text',
                altText: videoInfo.altText,
                signal: abortController.signal,
              },
            },
          })
        }

        // Restore captions (web only - captions use File objects)
        if (IS_WEB && videoInfo.captions.length > 0) {
          const captionTracks = videoInfo.captions.map(c => ({
            lang: c.lang,
            file: new File([c.content], `caption-${c.lang}.vtt`, {
              type: 'text/vtt',
            }),
          }))
          composerDispatch({
            type: 'update_post',
            postId,
            postAction: {
              type: 'embed_update_video',
              videoAction: {
                type: 'update_captions',
                updater: () => captionTracks,
                signal: abortController.signal,
              },
            },
          })
        }

        // Start video compression and upload
        processVideo(
          asset,
          videoAction => {
            composerDispatch({
              type: 'update_post',
              postId,
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
      } catch (e) {
        logger.error('Failed to restore video from draft', {
          postId,
          error: e,
        })
      }
    },
    [_, agent, currentDid, composerDispatch],
  )

  const handleSelectDraft = React.useCallback(
    async (draftSummary: DraftSummary) => {
      logger.debug('loading draft for editing', {
        draftId: draftSummary.id,
      })

      // Load local media files for the draft
      const {loadedMedia} = await loadDraftMedia(draftSummary.draft)

      // Extract original localRefs for orphan detection on save
      const originalLocalRefs = extractLocalRefs(draftSummary.draft)

      logger.debug('draft loaded', {
        draftId: draftSummary.id,
        loadedMediaCount: loadedMedia.size,
        originalLocalRefCount: originalLocalRefs.size,
      })

      // Convert server draft to composer posts (videos returned separately)
      const {posts, restoredVideos} = await draftToComposerPosts(
        draftSummary.draft,
        loadedMedia,
      )

      // Dispatch restore action (this also sets draftId in state)
      composerDispatch({
        type: 'restore_from_draft',
        draftId: draftSummary.id,
        posts,
        threadgateAllow: draftSummary.draft.threadgateAllow,
        postgateEmbeddingRules: draftSummary.draft.postgateEmbeddingRules,
        loadedMedia,
        originalLocalRefs,
      })

      // Track when the draft was created for metrics
      setLoadedDraftCreatedAt(draftSummary.createdAt)

      // Fire draft:load metric
      const draftPosts = draftSummary.posts
      const draftAgeMs = Date.now() - new Date(draftSummary.createdAt).getTime()
      ax.metric('draft:load', {
        draftAgeMs,
        hasText: draftPosts.some(p => p.text.trim().length > 0),
        hasImages: draftPosts.some(p => p.images && p.images.length > 0),
        hasVideo: draftPosts.some(p => !!p.video),
        hasGif: draftPosts.some(p => !!p.gif),
        postCount: draftPosts.length,
      })

      // Initiate video processing for any restored videos
      // This is async but we don't await - videos process in the background
      for (const [postIndex, videoInfo] of restoredVideos) {
        const postId = posts[postIndex].id
        restoreVideo(postId, videoInfo)
      }
    },
    [composerDispatch, restoreVideo, ax],
  )

  const [publishOnUpload, setPublishOnUpload] = useState(false)

  const onClose = useCallback(() => {
    closeComposer()
    clearThumbnailCache(queryClient)
    revokeAllMediaUrls()
  }, [closeComposer, queryClient])

  const handleSaveDraft = React.useCallback(async () => {
    const isNewDraft = !composerState.draftId
    try {
      const result = await saveDraft({
        composerState,
        existingDraftId: composerState.draftId,
      })
      composerDispatch({type: 'mark_saved', draftId: result.draftId})

      // Fire draft:save metric
      const posts = composerState.thread.posts
      ax.metric('draft:save', {
        isNewDraft,
        hasText: posts.some(p => p.richtext.text.trim().length > 0),
        hasImages: posts.some(p => p.embed.media?.type === 'images'),
        hasVideo: posts.some(p => p.embed.media?.type === 'video'),
        hasGif: posts.some(p => p.embed.media?.type === 'gif'),
        hasQuote: posts.some(p => !!p.embed.quote),
        hasLink: posts.some(p => !!p.embed.link),
        postCount: posts.length,
        textLength: posts[0].richtext.text.length,
      })

      onClose()
    } catch (e) {
      logger.error('Failed to save draft', {error: e})
      setError(_(msg`Failed to save draft`))
    }
  }, [saveDraft, composerState, composerDispatch, onClose, _, ax])

  // Save without closing - for use by DraftsButton
  const saveCurrentDraft = React.useCallback(async () => {
    const result = await saveDraft({
      composerState,
      existingDraftId: composerState.draftId,
    })
    composerDispatch({type: 'mark_saved', draftId: result.draftId})
  }, [saveDraft, composerState, composerDispatch])

  // Handle discard action - fires metric and closes composer
  const handleDiscard = React.useCallback(() => {
    const posts = thread.posts
    const hasContent = posts.some(
      post =>
        post.richtext.text.trim().length > 0 ||
        post.embed.media ||
        post.embed.link,
    )
    ax.metric('draft:discard', {
      logContext: 'ComposerClose',
      hadContent: hasContent,
      textLength: posts[0].richtext.text.length,
    })
    onClose()
  }, [thread.posts, ax, onClose])

  // Check if composer is empty (no content to save)
  const isComposerEmpty = React.useMemo(() => {
    // Has multiple posts means it's not empty
    if (thread.posts.length > 1) return false

    const firstPost = thread.posts[0]
    // Has text
    if (firstPost.richtext.text.trim().length > 0) return false
    // Has media
    if (firstPost.embed.media) return false
    // Has quote
    if (firstPost.embed.quote) return false
    // Has link
    if (firstPost.embed.link) return false

    return true
  }, [thread.posts])

  // Clear the composer (discard current content)
  const handleClearComposer = React.useCallback(() => {
    composerDispatch({
      type: 'clear',
      initInteractionSettings: preferences?.postInteractionSettings,
    })
  }, [composerDispatch, preferences?.postInteractionSettings])

  const insets = useSafeAreaInsets()
  const viewStyles = useMemo(
    () => ({
      paddingTop: IS_ANDROID ? insets.top : 0,
      paddingBottom:
        // iOS - when keyboard is closed, keep the bottom bar in the safe area
        (IS_IOS && !isKeyboardVisible) ||
        // Android - Android >=35 KeyboardAvoidingView adds double padding when
        // keyboard is closed, so we subtract that in the offset and add it back
        // here when the keyboard is open
        (IS_ANDROID && isKeyboardVisible)
          ? insets.bottom
          : 0,
    }),
    [insets, isKeyboardVisible],
  )

  const onPressCancel = useCallback(() => {
    if (textInput.current?.maybeClosePopup()) {
      return
    }

    const hasContent = thread.posts.some(
      post =>
        post.shortenedGraphemeLength > 0 || post.embed.media || post.embed.link,
    )

    // Show discard prompt if there's content AND either:
    // - No draft is loaded (new composition)
    // - Draft is loaded but has been modified
    if (hasContent && (!composerState.draftId || composerState.isDirty)) {
      closeAllDialogs()
      Keyboard.dismiss()
      discardPromptControl.open()
    } else {
      onClose()
    }
  }, [
    thread,
    composerState.draftId,
    composerState.isDirty,
    closeAllDialogs,
    discardPromptControl,
    onClose,
  ])

  useImperativeHandle(cancelRef, () => ({onPressCancel}))

  // On Android, pressing Back should ask confirmation.
  useEffect(() => {
    if (!IS_ANDROID) {
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
          langs: currentLanguages,
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
          ax.metric('post:create', {
            imageCount:
              post.embed.media?.type === 'images'
                ? post.embed.media.images.length
                : 0,
            isReply: index > 0 || !!replyTo,
            isPartOfThread: thread.posts.length > 1,
            hasLink: !!post.embed.link,
            hasQuote: !!post.embed.quote,
            langs: fromPostLanguages(currentLanguages),
            logContext: 'Composer',
          })
          index++
        }
      }
      if (thread.posts.length > 1) {
        ax.metric('thread:create', {
          postCount: thread.posts.length,
          isReply: !!replyTo,
        })
      }
    }
    if (postUri && !replyTo) {
      emitPostCreated()
    }
    // Clean up draft and its media after successful publish
    if (composerState.draftId && composerState.originalLocalRefs) {
      // Fire draft:post metric
      if (loadedDraftCreatedAt) {
        const draftAgeMs = Date.now() - new Date(loadedDraftCreatedAt).getTime()
        ax.metric('draft:post', {
          draftAgeMs,
          wasEdited: composerState.isDirty,
        })
      }

      logger.debug('post published, cleaning up draft', {
        draftId: composerState.draftId,
        mediaFileCount: composerState.originalLocalRefs.size,
      })
      cleanupPublishedDraft({
        draftId: composerState.draftId,
        originalLocalRefs: composerState.originalLocalRefs,
      })
    }
    setLangPrefs.savePostLanguageToHistory()
    if (initQuote) {
      // We want to wait for the quote count to update before we call `onPost`, which will refetch data
      whenAppViewReady(agent, initQuote.uri, res => {
        const anchor = res.data.thread.at(0)
        if (
          AppBskyUnspeccedDefs.isThreadItemPost(anchor?.value) &&
          anchor.value.post.quoteCount !== initQuote.quoteCount
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
    setTimeout(() => {
      Toast.show(
        <Toast.Outer>
          <Toast.Icon />
          <Toast.Text>
            {thread.posts.length > 1
              ? _(msg`Your posts were sent`)
              : replyTo
                ? _(msg`Your reply was sent`)
                : _(msg`Your post was sent`)}
          </Toast.Text>
          {postUri && (
            <Toast.Action
              label={_(msg`View post`)}
              onPress={() => {
                const {host: name, rkey} = new AtUri(postUri)
                navigation.navigate('PostThread', {name, rkey})
              }}>
              <Trans context="Action to view the post the user just created">
                View
              </Trans>
            </Toast.Action>
          )}
        </Toast.Outer>,
        {type: 'success'},
      )
    }, 500)
  }, [
    _,
    ax,
    agent,
    thread,
    canPost,
    isPublishing,
    currentLanguages,
    onClose,
    onPost,
    onPostSuccess,
    initQuote,
    replyTo,
    setLangPrefs,
    queryClient,
    navigation,
    composerState.draftId,
    composerState.originalLocalRefs,
    composerState.isDirty,
    cleanupPublishedDraft,
    loadedDraftCreatedAt,
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
      if (!IS_ANDROID) {
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
        replyToLanguages={replyToLanguages}
        currentLanguages={currentLanguages}
        onAcceptSuggestedLanguage={setAcceptedLanguageSuggestion}
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
        currentLanguages={currentLanguages}
        onSelectLanguage={onSelectLanguage}
        openGallery={openGallery}
      />
    </>
  )

  const IS_WEBFooterSticky = !IS_NATIVE && thread.posts.length > 1
  return (
    <BottomSheetPortalProvider>
      <KeyboardAvoidingView
        testID="composePostView"
        behavior={IS_IOS ? 'padding' : 'height'}
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
            onPublish={onPressPublish}
            onSelectDraft={handleSelectDraft}
            onSaveDraft={saveCurrentDraft}
            onDiscard={handleClearComposer}
            isEmpty={isComposerEmpty}
            isDirty={composerState.isDirty}
            isEditingDraft={!!composerState.draftId}
            textLength={thread.posts[0].richtext.text.length}>
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
                {IS_WEBFooterSticky && post.id === activePost.id && (
                  <View style={styles.stickyFooterWeb}>{footer}</View>
                )}
              </React.Fragment>
            ))}
          </Animated.ScrollView>
          {!IS_WEBFooterSticky && footer}
        </View>

        {replyTo ? (
          <Prompt.Basic
            control={discardPromptControl}
            title={_(msg`Discard draft?`)}
            description=""
            confirmButtonCta={_(msg`Discard`)}
            confirmButtonColor="negative"
            onConfirm={handleDiscard}
          />
        ) : (
          <Prompt.Outer control={discardPromptControl}>
            <Prompt.Content>
              <Prompt.TitleText>
                {composerState.draftId ? (
                  <Trans>Save changes?</Trans>
                ) : (
                  <Trans>Save draft?</Trans>
                )}
              </Prompt.TitleText>
              <Prompt.DescriptionText>
                {composerState.draftId ? (
                  <Trans>
                    You have unsaved changes to this draft, would you like to
                    save them?
                  </Trans>
                ) : (
                  <Trans>
                    Would you like to save this as a draft to edit later?
                  </Trans>
                )}
              </Prompt.DescriptionText>
            </Prompt.Content>
            <Prompt.Actions>
              <Prompt.Action
                cta={
                  composerState.draftId
                    ? _(msg`Save changes`)
                    : _(msg`Save draft`)
                }
                onPress={handleSaveDraft}
                color="primary"
              />
              <Prompt.Action
                cta={_(msg`Discard`)}
                onPress={handleDiscard}
                color="negative_subtle"
              />
              <Prompt.Cancel />
            </Prompt.Actions>
          </Prompt.Outer>
        )}
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
  const forceMinHeight = IS_WEB && isTextOnly && isActive
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
        (IS_WEB && uri.startsWith('data:image/gif'))
      ) {
        if (IS_NATIVE) return // web only
        const [mimeType] = uri.slice('data:'.length).split(';')
        if (!SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeTypes)) {
          Toast.show(_(msg`Unsupported video type: ${mimeType}`), {
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
        isTextOnly && isLastPost && IS_NATIVE && a.flex_grow,
      ]}>
      <View style={[a.flex_row, IS_NATIVE && a.flex_1]}>
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
            <ButtonIcon icon={XIcon} />
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
  onSelectDraft,
  onSaveDraft,
  onDiscard,
  isEmpty,
  isDirty,
  isEditingDraft,
  textLength,
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
  onSelectDraft: (draft: DraftSummary) => void
  onSaveDraft: () => Promise<void>
  onDiscard: () => void
  isEmpty: boolean
  isDirty: boolean
  isEditingDraft: boolean
  textLength: number
  topBarAnimatedStyle: StyleProp<ViewStyle>
  children?: React.ReactNode
}) {
  const t = useTheme()
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
          style={[{paddingLeft: 7, paddingRight: 7}]}
          hoverStyle={[a.bg_transparent, {opacity: 0.5}]}
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
            <Text style={[t.atoms.text_contrast_medium]}>
              {publishingStage}
            </Text>
            <View style={styles.postBtn}>
              <ActivityIndicator />
            </View>
          </>
        ) : (
          <>
            {!isReply && (
              <DraftsButton
                onSelectDraft={onSelectDraft}
                onSaveDraft={onSaveDraft}
                onDiscard={onDiscard}
                isEmpty={isEmpty}
                isDirty={isDirty}
                isEditingDraft={isEditingDraft}
                textLength={textLength}
              />
            )}
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
              color="primary"
              size="small"
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
          </>
        )}
      </View>
      {children}
    </Animated.View>
  )
}

function AltTextReminder({error}: {error: string}) {
  return (
    <Admonition type="error" style={[a.mt_2xs, a.mb_sm, a.mx_lg]}>
      {error}
    </Admonition>
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
          style={[a.pb_sm, video ? [a.pt_md] : [a.pt_xl], IS_WEB && [a.pb_md]]}>
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
  currentLanguages,
  onSelectLanguage,
  openGallery,
}: {
  post: PostDraft
  dispatch: (action: PostAction) => void
  showAddButton: boolean
  onEmojiButtonPress: () => void
  onError: (error: string) => void
  onSelectVideo: (postId: string, asset: ImagePickerAsset) => void
  onAddPost: () => void
  currentLanguages: string[]
  onSelectLanguage?: (language: string) => void
  openGallery?: boolean
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
          const selectedImages: ComposerImage[] = []

          await Promise.all(
            assets.map(async image => {
              const composerImage = await createComposerImage({
                path: image.uri,
                width: image.width,
                height: image.height,
                mime: image.mimeType!,
              })
              selectedImages.push(composerImage)
            }),
          ).catch(e => {
            logger.error(`createComposerImage failed`, {
              safeMessage: e.message,
            })
          })

          onImageAdd(selectedImages)
        } else if (type === 'video') {
          onSelectVideo(post.id, assets[0])
        } else if (type === 'gif') {
          onSelectVideo(post.id, assets[0])
        }
      }

      errors.map(error => {
        Toast.show(error, {
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
                autoOpen={openGallery}
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
                  <EmojiSmileIcon size="lg" />
                </Button>
              ) : null}
            </ToolbarWrapper>
          )}
        </LayoutAnimationConfig>
      </View>
      <View style={[a.flex_row, a.align_center, a.justify_between]}>
        {showAddButton && (
          <Button
            label={_(msg`Add another post to thread`)}
            onPress={onAddPost}
            style={[a.p_sm]}
            variant="ghost"
            shape="round"
            color="primary">
            <PlusIcon size="lg" />
          </Button>
        )}
        <PostLanguageSelect
          currentLanguages={currentLanguages}
          onSelectLanguage={onSelectLanguage}
        />
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
  if (!IS_IOS) {
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
  fn: (res: AppBskyUnspeccedGetPostThreadV2.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      agent.app.bsky.unspecced.getPostThreadV2({
        anchor: uri,
        above: false,
        below: 0,
        branchingFactor: 0,
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
    if (IS_IOS) {
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
          <CircleInfoIcon fill={t.palette.negative_400} />
          <Text style={[a.flex_1, a.leading_snug, {paddingTop: 1}]}>
            {error}
          </Text>
          <Button
            label={_(msg`Dismiss error`)}
            size="tiny"
            color="secondary"
            variant="ghost"
            shape="round"
            style={[a.absolute, {top: 0, right: 0}]}
            onPress={onClearError}>
            <ButtonIcon icon={XIcon} />
          </Button>
        </View>
        {videoError && videoState.jobId && (
          <Text
            style={[
              {paddingLeft: 28},
              a.text_xs,
              a.font_semi_bold,
              a.leading_snug,
              t.atoms.text_contrast_low,
            ]}>
            <Trans>Job ID: {videoState.jobId}</Trans>
          </Text>
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
  if (IS_WEB) return children
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
      <Text style={[a.font_semi_bold, a.ml_sm]}>{text}</Text>
    </ToolbarWrapper>
  )
}
