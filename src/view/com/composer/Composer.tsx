import React, {
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {LinearGradient} from 'expo-linear-gradient'
import {
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
  BskyAgent,
} from '@atproto/api'
import {RichText} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {observer} from 'mobx-react-lite'

import {until} from '#/lib/async/until'
import {
  createGIFDescription,
  parseAltFromGIFDescription,
} from '#/lib/gif-alt-text'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {LikelyType} from '#/lib/link-meta/link-meta'
import {logEvent, useGate} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {emitPostCreated} from '#/state/events'
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
import {ThreadgateSetting} from '#/state/queries/threadgate'
import {useAgent, useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell/composer'
import {useAnalytics} from 'lib/analytics/analytics'
import * as apilib from 'lib/api/index'
import {HITSLOP_10, MAX_GRAPHEME_LENGTH} from 'lib/constants'
import {useIsKeyboardVisible} from 'lib/hooks/useIsKeyboardVisible'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {cleanError} from 'lib/strings/errors'
import {insertMentionAt} from 'lib/strings/mention-manip'
import {shortenLinks} from 'lib/strings/rich-text-manip'
import {colors, gradients, s} from 'lib/styles'
import {isAndroid, isIOS, isNative, isWeb} from 'platform/detection'
import {useDialogStateControlContext} from 'state/dialogs'
import {GalleryModel} from 'state/models/media/gallery'
import {ComposerOpts} from 'state/shell/composer'
import {ComposerReplyTo} from 'view/com/composer/ComposerReplyTo'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {EmojiArc_Stroke2_Corner0_Rounded as EmojiSmile} from '#/components/icons/Emoji'
import * as Prompt from '#/components/Prompt'
import {QuoteEmbed, QuoteX} from '../util/post-embeds/QuoteEmbed'
import {Text} from '../util/text/Text'
import * as Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {CharProgress} from './char-progress/CharProgress'
import {ExternalEmbed} from './ExternalEmbed'
import {GifAltText} from './GifAltText'
import {LabelsBtn} from './labels/LabelsBtn'
import {Gallery} from './photos/Gallery'
import {OpenCameraBtn} from './photos/OpenCameraBtn'
import {SelectGifBtn} from './photos/SelectGifBtn'
import {SelectPhotoBtn} from './photos/SelectPhotoBtn'
import {SelectLangBtn} from './select-language/SelectLangBtn'
import {SuggestedLanguage} from './select-language/SuggestedLanguage'
// TODO: Prevent naming components that coincide with RN primitives
// due to linting false positives
import {TextInput, TextInputRef} from './text-input/TextInput'
import {ThreadgateBtn} from './threadgate/ThreadgateBtn'
import {useExternalLinkFetch} from './useExternalLinkFetch'
import {SelectVideoBtn} from './videos/SelectVideoBtn'
import {useVideoState} from './videos/state'
import {VideoPreview} from './videos/VideoPreview'
import {VideoTranscodeProgress} from './videos/VideoTranscodeProgress'
import hairlineWidth = StyleSheet.hairlineWidth

type CancelRef = {
  onPressCancel: () => void
}

type Props = ComposerOpts
export const ComposePost = observer(function ComposePost({
  replyTo,
  onPost,
  quote: initQuote,
  mention: initMention,
  openPicker,
  text: initText,
  imageUris: initImageUris,
  cancelRef,
}: Props & {
  cancelRef?: React.RefObject<CancelRef>
}) {
  const gate = useGate()
  const {currentAccount} = useSession()
  const agent = useAgent()
  const {data: currentProfile} = useProfileQuery({did: currentAccount!.did})
  const {isModalActive} = useModals()
  const {closeComposer} = useComposerControls()
  const {track} = useAnalytics()
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
  const [richtext, setRichText] = useState(
    new RichText({
      text: initText
        ? initText
        : initMention
        ? insertMentionAt(
            `@${initMention}`,
            initMention.length + 1,
            `${initMention}`,
          ) // insert mention if passed in
        : '',
    }),
  )
  const graphemeLength = useMemo(() => {
    return shortenLinks(richtext).graphemeLength
  }, [richtext])
  const [quote, setQuote] = useState<ComposerOpts['quote'] | undefined>(
    initQuote,
  )
  const {
    video,
    onSelectVideo,
    videoPending,
    videoProcessingData,
    clearVideo,
    videoProcessingProgress,
  } = useVideoState({setError})
  const {extLink, setExtLink} = useExternalLinkFetch({setQuote})
  const [extGif, setExtGif] = useState<Gif>()
  const [labels, setLabels] = useState<string[]>([])
  const [threadgate, setThreadgate] = useState<ThreadgateSetting[]>([])

  const gallery = useMemo(
    () => new GalleryModel(initImageUris),
    [initImageUris],
  )
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
    if (graphemeLength > 0 || !gallery.isEmpty || extGif) {
      closeAllDialogs()
      Keyboard.dismiss()
      discardPromptControl.open()
    } else {
      onClose()
    }
  }, [
    extGif,
    graphemeLength,
    gallery.isEmpty,
    closeAllDialogs,
    discardPromptControl,
    onClose,
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

  const onNewLink = useCallback(
    (uri: string) => {
      if (extLink != null) return
      setExtLink({uri, isLoading: true})
    },
    [extLink, setExtLink],
  )

  const onPhotoPasted = useCallback(
    async (uri: string) => {
      track('Composer:PastedPhotos')
      await gallery.paste(uri)
    },
    [gallery, track],
  )

  const isAltTextRequiredAndMissing = useMemo(() => {
    if (!requireAltTextEnabled) return false

    if (gallery.needsAltText) return true
    if (extGif) {
      if (!extLink?.meta?.description) return true

      const parsedAlt = parseAltFromGIFDescription(extLink.meta.description)
      if (!parsedAlt.isPreferred) return true
    }
    return false
  }, [gallery.needsAltText, extLink, extGif, requireAltTextEnabled])

  const onPressPublish = async () => {
    if (isProcessing || graphemeLength > MAX_GRAPHEME_LENGTH) {
      return
    }

    if (isAltTextRequiredAndMissing) {
      return
    }

    setError('')

    if (
      richtext.text.trim().length === 0 &&
      gallery.isEmpty &&
      !extLink &&
      !quote
    ) {
      setError(_(msg`Did you want to say anything?`))
      return
    }
    if (extLink?.isLoading) {
      setError(_(msg`Please wait for your link card to finish loading`))
      return
    }

    setIsProcessing(true)

    let postUri
    try {
      postUri = (
        await apilib.post(agent, {
          rawText: richtext.text,
          replyTo: replyTo?.uri,
          images: gallery.images,
          quote,
          extLink,
          labels,
          threadgate,
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
        hasImages: gallery.size > 0,
      })

      if (extLink) {
        setExtLink({
          ...extLink,
          isLoading: true,
          localThumb: undefined,
        } as apilib.ExternalEmbedDraft)
      }
      let err = cleanError(e.message)
      if (err.includes('not locate record')) {
        err = _(
          msg`We're sorry! The post you are replying to has been deleted.`,
        )
      }
      setError(err)
      setIsProcessing(false)
      return
    } finally {
      if (postUri) {
        logEvent('post:create', {
          imageCount: gallery.size,
          isReply: replyTo != null,
          hasLink: extLink != null,
          hasQuote: quote != null,
          langs: langPrefs.postLanguage,
          logContext: 'Composer',
        })
      }
      track('Create Post', {
        imageCount: gallery.size,
      })
      if (replyTo && replyTo.uri) track('Post:Reply')
    }
    if (postUri && !replyTo) {
      emitPostCreated()
    }
    setLangPrefs.savePostLanguageToHistory()
    onPost?.()
    onClose()
    Toast.show(
      replyTo
        ? _(msg`Your reply has been published`)
        : _(msg`Your post has been published`),
    )
  }

  const canPost = useMemo(
    () => graphemeLength <= MAX_GRAPHEME_LENGTH && !isAltTextRequiredAndMissing,
    [graphemeLength, isAltTextRequiredAndMissing],
  )
  const selectTextInputPlaceholder = replyTo
    ? _(msg`Write your reply`)
    : _(msg`What's up?`)

  const canSelectImages =
    gallery.size < 4 && !extLink && !video && !videoPending
  const hasMedia = gallery.size > 0 || Boolean(extLink) || Boolean(video)

  const onEmojiButtonPress = useCallback(() => {
    openPicker?.(textInput.current?.getCursorPosition())
  }, [openPicker])

  const focusTextInput = useCallback(() => {
    textInput.current?.focus()
  }, [])

  const onSelectGif = useCallback(
    (gif: Gif) => {
      setExtLink({
        uri: `${gif.media_formats.gif.url}?hh=${gif.media_formats.gif.dims[1]}&ww=${gif.media_formats.gif.dims[0]}`,
        isLoading: true,
        meta: {
          url: gif.media_formats.gif.url,
          image: gif.media_formats.preview.url,
          likelyType: LikelyType.HTML,
          title: gif.content_description,
          description: createGIFDescription(gif.content_description),
        },
      })
      setExtGif(gif)
    },
    [setExtLink],
  )

  const handleChangeGifAltText = useCallback(
    (altText: string) => {
      setExtLink(ext =>
        ext && ext.meta
          ? {
              ...ext,
              meta: {
                ...ext.meta,
                description: createGIFDescription(
                  ext.meta.title ?? '',
                  altText,
                ),
              },
            }
          : ext,
      )
    },
    [setExtLink],
  )

  const {
    scrollHandler,
    onScrollViewContentSizeChange,
    onScrollViewLayout,
    topBarAnimatedStyle,
    bottomBarAnimatedStyle,
  } = useAnimatedBorders()

  const keyboardVerticalOffset = useKeyboardVerticalOffset()

  return (
    <KeyboardAvoidingView
      testID="composePostView"
      behavior={isIOS ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={a.flex_1}>
      <View style={[a.flex_1, viewStyles]} aria-modal accessibilityViewIsModal>
        <Animated.View style={topBarAnimatedStyle}>
          <View style={styles.topbarInner}>
            <TouchableOpacity
              testID="composerDiscardButton"
              onPress={onPressCancel}
              onAccessibilityEscape={onPressCancel}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Cancel`)}
              accessibilityHint={_(
                msg`Closes post composer and discards post draft`,
              )}
              hitSlop={HITSLOP_10}>
              <Text style={[pal.link, s.f18]}>
                <Trans>Cancel</Trans>
              </Text>
            </TouchableOpacity>
            <View style={a.flex_1} />
            {isProcessing ? (
              <>
                <Text style={pal.textLight}>{processingState}</Text>
                <View style={styles.postBtn}>
                  <ActivityIndicator />
                </View>
              </>
            ) : (
              <>
                <LabelsBtn
                  labels={labels}
                  onChange={setLabels}
                  hasMedia={hasMedia}
                />
                {canPost ? (
                  <TouchableOpacity
                    testID="composerPublishBtn"
                    onPress={onPressPublish}
                    accessibilityRole="button"
                    accessibilityLabel={
                      replyTo ? _(msg`Publish reply`) : _(msg`Publish post`)
                    }
                    accessibilityHint="">
                    <LinearGradient
                      colors={[
                        gradients.blueLight.start,
                        gradients.blueLight.end,
                      ]}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.postBtn}>
                      <Text style={[s.white, s.f16, s.bold]}>
                        {replyTo ? (
                          <Trans context="action">Reply</Trans>
                        ) : (
                          <Trans context="action">Post</Trans>
                        )}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.postBtn, pal.btn]}>
                    <Text style={[pal.textLight, s.f16, s.bold]}>
                      <Trans context="action">Post</Trans>
                    </Text>
                  </View>
                )}
              </>
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
          {error !== '' && (
            <View style={styles.errorLine}>
              <View style={styles.errorIcon}>
                <FontAwesomeIcon
                  icon="exclamation"
                  style={{color: colors.red4}}
                  size={10}
                />
              </View>
              <Text style={[s.red4, a.flex_1]}>{error}</Text>
            </View>
          )}
        </Animated.View>
        <Animated.ScrollView
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
              setRichText={setRichText}
              onPhotoPasted={onPhotoPasted}
              onPressPublish={onPressPublish}
              onNewLink={onNewLink}
              onError={setError}
              accessible={true}
              accessibilityLabel={_(msg`Write post`)}
              accessibilityHint={_(
                msg`Compose posts up to ${MAX_GRAPHEME_LENGTH} characters in length`,
              )}
            />
          </View>

          <Gallery gallery={gallery} />
          {gallery.isEmpty && extLink && (
            <View style={a.relative}>
              <ExternalEmbed
                link={extLink}
                gif={extGif}
                onRemove={() => {
                  setExtLink(undefined)
                  setExtGif(undefined)
                }}
              />
              <GifAltText
                link={extLink}
                gif={extGif}
                onSubmit={handleChangeGifAltText}
              />
            </View>
          )}

          {quote ? (
            <View style={[s.mt5, s.mb2, isWeb && s.mb10]}>
              <View style={{pointerEvents: 'none'}}>
                <QuoteEmbed quote={quote} />
              </View>
              {quote.uri !== initQuote?.uri && (
                <QuoteX onRemove={() => setQuote(undefined)} />
              )}
            </View>
          ) : null}
          {videoPending && videoProcessingData ? (
            <VideoTranscodeProgress
              input={videoProcessingData}
              progress={videoProcessingProgress}
            />
          ) : (
            video && (
              // remove suspense when we get rid of lazy
              <Suspense fallback={null}>
                <VideoPreview video={video} clear={clearVideo} />
              </Suspense>
            )
          )}
        </Animated.ScrollView>
        <SuggestedLanguage text={richtext.text} />

        {replyTo ? null : (
          <ThreadgateBtn
            threadgate={threadgate}
            onChange={setThreadgate}
            style={bottomBarAnimatedStyle}
          />
        )}
        <View
          style={[
            t.atoms.bg,
            t.atoms.border_contrast_medium,
            styles.bottomBar,
          ]}>
          <View style={[a.flex_row, a.align_center, a.gap_xs]}>
            <SelectPhotoBtn gallery={gallery} disabled={!canSelectImages} />
            {gate('videos') && (
              <SelectVideoBtn
                onSelectVideo={onSelectVideo}
                disabled={!canSelectImages}
              />
            )}
            <OpenCameraBtn gallery={gallery} disabled={!canSelectImages} />
            <SelectGifBtn
              onClose={focusTextInput}
              onSelectGif={onSelectGif}
              disabled={hasMedia}
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
          </View>
          <View style={a.flex_1} />
          <SelectLangBtn />
          <CharProgress count={graphemeLength} />
        </View>
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
  )
})

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
      borderBottomWidth: hairlineWidth,
      borderColor: interpolateColor(
        hasScrolledTop.value,
        [0, 1],
        ['transparent', t.atoms.border_contrast_medium.borderColor],
      ),
    }
  })
  const bottomBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderTopWidth: hairlineWidth,
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
    paddingHorizontal: 16,
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
    borderWidth: hairlineWidth,
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
  bottomBar: {
    flexDirection: 'row',
    paddingVertical: 4,
    // should be 8 but due to visual alignment we have to fudge it
    paddingLeft: 7,
    paddingRight: 16,
    alignItems: 'center',
    borderTopWidth: hairlineWidth,
  },
})
