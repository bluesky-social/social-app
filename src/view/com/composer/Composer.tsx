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
import {shortenLinks} from '#/lib/strings/rich-text-manip'
import {colors, s} from '#/lib/styles'
import {logger} from '#/logger'
import {isAndroid, isIOS, isNative, isWeb} from '#/platform/detection'
import {useDialogStateControlContext} from '#/state/dialogs'
import {emitPostCreated} from '#/state/events'
import {ComposerImage, pasteImage} from '#/state/gallery'
import {useModalControls} from '#/state/modals'
import {useModals} from '#/state/modals'
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
import {createPortalGroup} from '#/components/Portal'
import * as Prompt from '#/components/Prompt'
import {Text as NewText} from '#/components/Typography'
import {
  composerReducer,
  createComposerState,
  MAX_IMAGES,
} from './state/composer'
import {NO_VIDEO, NoVideoState, processVideo, VideoState} from './state/video'

const Portal = createPortalGroup()

type CancelRef = {
  onPressCancel: () => void
}

const NO_IMAGES: ComposerImage[] = []

type Props = ComposerOpts
export const ComposePost = ({
  replyTo,
  onPost,
  quote: initQuote,
  quoteCount: initQuoteCount,
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
  const {data: currentProfile} = useProfileQuery({did: currentDid})
  const {isModalActive} = useModals()
  const {closeComposer} = useComposerControls()
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  const {_} = useLingui()
  const requireAltTextEnabled = useRequireAltTextEnabled()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const textInput = useRef<TextInputRef>(null)
  const discardPromptControl = Prompt.usePromptControl()
  const {closeAllDialogs} = useDialogStateControlContext()
  const {closeAllModals} = useModalControls()
  const t = useTheme()

  const [isKeyboardVisible] = useIsKeyboardVisible({iosUseWillEvents: true})
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingState, setProcessingState] = useState('')
  const [error, setError] = useState('')

  const [draft, dispatch] = useReducer(
    composerReducer,
    {initImageUris, initQuoteUri: initQuote?.uri, initText, initMention},
    createComposerState,
  )
  const richtext = draft.richtext
  let quote: string | undefined
  if (draft.embed.quote) {
    quote = draft.embed.quote.uri
  }
  let images = NO_IMAGES
  if (draft.embed.media?.type === 'images') {
    images = draft.embed.media.images
  }
  let videoState: VideoState | NoVideoState = NO_VIDEO
  if (draft.embed.media?.type === 'video') {
    videoState = draft.embed.media.video
  }
  let extGif: Gif | undefined
  let extGifAlt: string | undefined
  if (draft.embed.media?.type === 'gif') {
    extGif = draft.embed.media.gif
    extGifAlt = draft.embed.media.alt
  }
  let extLink: string | undefined
  if (draft.embed.link) {
    extLink = draft.embed.link.uri
  }

  const graphemeLength = useMemo(() => {
    return shortenLinks(richtext).graphemeLength
  }, [richtext])

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
    [_, agent, currentDid],
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

  const updateVideoDimensions = useCallback(
    (width: number, height: number) => {
      dispatch({
        type: 'embed_update_video',
        videoAction: {
          type: 'update_dimensions',
          width,
          height,
          signal: videoState.abortController.signal,
        },
      })
    },
    [videoState.abortController],
  )

  const hasVideo = Boolean(videoState.asset || videoState.video)
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
      graphemeLength > 0 ||
      images.length !== 0 ||
      extGif ||
      videoState.status !== 'idle'
    ) {
      closeAllDialogs()
      Keyboard.dismiss()
      discardPromptControl.open()
    } else {
      onClose()
    }
  }, [
    extGif,
    graphemeLength,
    images.length,
    closeAllDialogs,
    discardPromptControl,
    onClose,
    videoState.status,
  ])

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

  // listen to escape key on desktop web
  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onPressCancel()
      }
    },
    [onPressCancel],
  )
  useEffect(() => {
    if (isWeb && !isModalActive) {
      window.addEventListener('keydown', onEscape)
      return () => window.removeEventListener('keydown', onEscape)
    }
  }, [onEscape, isModalActive])

  const onNewLink = useCallback((uri: string) => {
    dispatch({type: 'embed_add_uri', uri})
  }, [])

  const onImageAdd = useCallback(
    (next: ComposerImage[]) => {
      dispatch({
        type: 'embed_add_images',
        images: next,
      })
    },
    [dispatch],
  )

  const onPhotoPasted = useCallback(
    async (uri: string) => {
      if (uri.startsWith('data:video/')) {
        selectVideo({uri, type: 'video', height: 0, width: 0})
      } else {
        const res = await pasteImage(uri)
        onImageAdd([res])
      }
    },
    [selectVideo, onImageAdd],
  )

  const isAltTextRequiredAndMissing = useMemo(() => {
    if (!requireAltTextEnabled) return false

    if (images.some(img => img.alt === '')) return true

    if (extGif && !extGifAlt) return true

    return false
  }, [images, extGifAlt, extGif, requireAltTextEnabled])

  const onPressPublish = React.useCallback(
    async (finishedUploading?: boolean) => {
      if (isProcessing || graphemeLength > MAX_GRAPHEME_LENGTH) {
        return
      }

      if (isAltTextRequiredAndMissing) {
        return
      }

      if (
        !finishedUploading &&
        videoState.asset &&
        videoState.status !== 'done'
      ) {
        setPublishOnUpload(true)
        return
      }

      setError('')

      if (
        richtext.text.trim().length === 0 &&
        images.length === 0 &&
        !extLink &&
        !quote &&
        videoState.status === 'idle'
      ) {
        setError(_(msg`Did you want to say anything?`))
        return
      }

      setIsProcessing(true)

      let postUri
      try {
        postUri = (
          await apilib.post(agent, queryClient, {
            draft: draft,
            replyTo: replyTo?.uri,
            onStateChange: setProcessingState,
            langs: toPostLanguages(langPrefs.postLanguage),
          })
        ).uri
        try {
          await whenAppViewReady(agent, postUri, res => {
            const thread = res.data.thread
            return AppBskyFeedDefs.isThreadViewPost(thread)
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
          hasImages: images.length > 0,
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
        setIsProcessing(false)
        return
      } finally {
        if (postUri) {
          logEvent('post:create', {
            imageCount: images.length,
            isReply: replyTo != null,
            hasLink: extLink != null,
            hasQuote: quote != null,
            langs: langPrefs.postLanguage,
            logContext: 'Composer',
          })
        }
      }
      if (postUri && !replyTo) {
        emitPostCreated()
      }
      setLangPrefs.savePostLanguageToHistory()
      if (initQuote && initQuoteCount !== undefined) {
        // We want to wait for the quote count to update before we call `onPost`, which will refetch data
        whenAppViewReady(agent, initQuote.uri, res => {
          const thread = res.data.thread
          if (
            AppBskyFeedDefs.isThreadViewPost(thread) &&
            thread.post.quoteCount !== initQuoteCount
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
      draft,
      extLink,
      images,
      graphemeLength,
      isAltTextRequiredAndMissing,
      isProcessing,
      langPrefs.postLanguage,
      onClose,
      onPost,
      quote,
      initQuote,
      initQuoteCount,
      replyTo,
      richtext.text,
      setLangPrefs,
      videoState.asset,
      videoState.status,
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

  const canPost = useMemo(
    () => graphemeLength <= MAX_GRAPHEME_LENGTH && !isAltTextRequiredAndMissing,
    [graphemeLength, isAltTextRequiredAndMissing],
  )
  const selectTextInputPlaceholder = replyTo
    ? _(msg`Write your reply`)
    : _(msg`What's up?`)

  const canSelectImages =
    images.length < MAX_IMAGES &&
    videoState.status === 'idle' &&
    !videoState.video
  const hasMedia = images.length > 0 || Boolean(videoState.video)

  const onEmojiButtonPress = useCallback(() => {
    openEmojiPicker?.(textInput.current?.getCursorPosition())
  }, [openEmojiPicker])

  const focusTextInput = useCallback(() => {
    textInput.current?.focus()
  }, [])

  const onSelectGif = useCallback((gif: Gif) => {
    dispatch({type: 'embed_add_gif', gif})
  }, [])

  const handleChangeGifAltText = useCallback((altText: string) => {
    dispatch({type: 'embed_update_gif', alt: altText})
  }, [])

  const {
    scrollHandler,
    onScrollViewContentSizeChange,
    onScrollViewLayout,
    topBarAnimatedStyle,
    bottomBarAnimatedStyle,
  } = useAnimatedBorders()

  const keyboardVerticalOffset = useKeyboardVerticalOffset()

  return (
    <Portal.Provider>
      <KeyboardAvoidingView
        testID="composePostView"
        behavior={isIOS ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={a.flex_1}>
        <View
          style={[a.flex_1, viewStyles]}
          aria-modal
          accessibilityViewIsModal>
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
                style={[
                  a.rounded_full,
                  a.py_sm,
                  {paddingLeft: 7, paddingRight: 7},
                ]}
                onPress={onPressCancel}
                accessibilityHint={_(
                  msg`Closes post composer and discards post draft`,
                )}>
                <ButtonText style={[a.text_md]}>
                  <Trans>Cancel</Trans>
                </ButtonText>
              </Button>
              <View style={a.flex_1} />
              {isProcessing ? (
                <>
                  <Text style={pal.textLight}>{processingState}</Text>
                  <View style={styles.postBtn}>
                    <ActivityIndicator />
                  </View>
                </>
              ) : (
                <View style={[styles.postBtnWrapper]}>
                  <LabelsBtn
                    labels={draft.labels}
                    onChange={nextLabels => {
                      dispatch({type: 'update_labels', labels: nextLabels})
                    }}
                    hasMedia={hasMedia || Boolean(extLink)}
                  />
                  {canPost ? (
                    <Button
                      testID="composerPublishBtn"
                      label={
                        replyTo ? _(msg`Publish reply`) : _(msg`Publish post`)
                      }
                      variant="solid"
                      color="primary"
                      shape="default"
                      size="small"
                      style={[a.rounded_full, a.py_sm]}
                      onPress={() => onPressPublish()}
                      disabled={
                        videoState.status !== 'idle' && publishOnUpload
                      }>
                      <ButtonText style={[a.text_md]}>
                        {replyTo ? (
                          <Trans context="action">Reply</Trans>
                        ) : (
                          <Trans context="action">Post</Trans>
                        )}
                      </ButtonText>
                    </Button>
                  ) : (
                    <View style={[styles.postBtn, pal.btn]}>
                      <Text style={[pal.textLight, s.f16, s.bold]}>
                        <Trans context="action">Post</Trans>
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {isAltTextRequiredAndMissing && (
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
            )}
            <ErrorBanner
              error={error}
              videoState={videoState}
              clearError={() => setError('')}
              clearVideo={clearVideo}
            />
          </Animated.View>
          <Animated.ScrollView
            layout={native(LinearTransition)}
            onScroll={scrollHandler}
            style={styles.scrollView}
            keyboardShouldPersistTaps="always"
            onContentSizeChange={onScrollViewContentSizeChange}
            onLayout={onScrollViewLayout}>
            {replyTo ? <ComposerReplyTo replyTo={replyTo} /> : undefined}

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
                setRichText={rt => {
                  dispatch({type: 'update_richtext', richtext: rt})
                }}
                onPhotoPasted={onPhotoPasted}
                onPressPublish={() => onPressPublish()}
                onNewLink={onNewLink}
                onError={setError}
                accessible={true}
                accessibilityLabel={_(msg`Write post`)}
                accessibilityHint={_(
                  msg`Compose posts up to ${MAX_GRAPHEME_LENGTH} characters in length`,
                )}
              />
            </View>

            <Gallery
              images={images}
              dispatch={dispatch}
              Portal={Portal.Portal}
            />

            {extGif && (
              <View style={a.relative} key={extGif.url}>
                <ExternalEmbedGif
                  gif={extGif}
                  onRemove={() => {
                    dispatch({type: 'embed_remove_gif'})
                  }}
                />
                <GifAltTextDialog
                  gif={extGif}
                  altText={extGifAlt ?? ''}
                  onSubmit={handleChangeGifAltText}
                  Portal={Portal.Portal}
                />
              </View>
            )}

            {!draft.embed.media && extLink && (
              <View style={a.relative} key={extLink}>
                <ExternalEmbedLink
                  uri={extLink}
                  onRemove={() => {
                    dispatch({type: 'embed_remove_link'})
                  }}
                />
              </View>
            )}

            <LayoutAnimationConfig skipExiting>
              {hasVideo && (
                <Animated.View
                  style={[a.w_full, a.mt_lg]}
                  entering={native(ZoomIn)}
                  exiting={native(ZoomOut)}>
                  {videoState.asset &&
                    (videoState.status === 'compressing' ? (
                      <VideoTranscodeProgress
                        asset={videoState.asset}
                        progress={videoState.progress}
                        clear={clearVideo}
                      />
                    ) : videoState.video ? (
                      <VideoPreview
                        asset={videoState.asset}
                        video={videoState.video}
                        setDimensions={updateVideoDimensions}
                        clear={clearVideo}
                      />
                    ) : null)}
                  <SubtitleDialogBtn
                    defaultAltText={videoState.altText}
                    saveAltText={altText =>
                      dispatch({
                        type: 'embed_update_video',
                        videoAction: {
                          type: 'update_alt_text',
                          altText,
                          signal: videoState.abortController.signal,
                        },
                      })
                    }
                    captions={videoState.captions}
                    setCaptions={updater => {
                      dispatch({
                        type: 'embed_update_video',
                        videoAction: {
                          type: 'update_captions',
                          updater,
                          signal: videoState.abortController.signal,
                        },
                      })
                    }}
                    Portal={Portal.Portal}
                  />
                </Animated.View>
              )}
            </LayoutAnimationConfig>
            <View style={!hasVideo ? [a.mt_md] : []}>
              {quote ? (
                <View style={[s.mt5, s.mb2, isWeb && s.mb10]}>
                  <View style={{pointerEvents: 'none'}}>
                    <LazyQuoteEmbed uri={quote} />
                  </View>
                  {!initQuote && (
                    <QuoteX
                      onRemove={() => {
                        dispatch({type: 'embed_remove_quote'})
                      }}
                    />
                  )}
                </View>
              ) : null}
            </View>
          </Animated.ScrollView>
          <SuggestedLanguage text={richtext.text} />

          {replyTo ? null : (
            <ThreadgateBtn
              postgate={draft.postgate}
              onChangePostgate={nextPostgate => {
                dispatch({type: 'update_postgate', postgate: nextPostgate})
              }}
              threadgateAllowUISettings={draft.threadgate}
              onChangeThreadgateAllowUISettings={nextThreadgate => {
                dispatch({
                  type: 'update_threadgate',
                  threadgate: nextThreadgate,
                })
              }}
              style={bottomBarAnimatedStyle}
              Portal={Portal.Portal}
            />
          )}
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
              {videoState.status !== 'idle' && videoState.status !== 'done' ? (
                <VideoUploadToolbar state={videoState} />
              ) : (
                <ToolbarWrapper style={[a.flex_row, a.align_center, a.gap_xs]}>
                  <SelectPhotoBtn
                    size={images.length}
                    disabled={!canSelectImages}
                    onAdd={onImageAdd}
                  />
                  <SelectVideoBtn
                    onSelectVideo={selectVideo}
                    disabled={!canSelectImages || images?.length > 0}
                    setError={setError}
                  />
                  <OpenCameraBtn
                    disabled={!canSelectImages}
                    onAdd={onImageAdd}
                  />
                  <SelectGifBtn
                    onClose={focusTextInput}
                    onSelectGif={onSelectGif}
                    disabled={hasMedia}
                    Portal={Portal.Portal}
                  />
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
              <CharProgress count={graphemeLength} style={{width: 65}} />
            </View>
          </View>
        </View>
        <Prompt.Basic
          control={discardPromptControl}
          title={_(msg`Discard draft?`)}
          description={_(msg`Are you sure you'd like to discard this draft?`)}
          onConfirm={onClose}
          confirmButtonCta={_(msg`Discard`)}
          confirmButtonColor="negative"
          Portal={Portal.Portal}
        />
      </KeyboardAvoidingView>
      <Portal.Outlet />
    </Portal.Provider>
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
  postBtnWrapper: {
    flexDirection: 'row',
    gap: 14,
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
      text = _('Compressing video...')
      break
    case 'uploading':
      text = _('Uploading video...')
      break
    case 'processing':
      text = _('Processing video...')
      break
    case 'error':
      text = _('Error')
      wheelProgress = 100
      break
    case 'done':
      text = _('Video uploaded')
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
