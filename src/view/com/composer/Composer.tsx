import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {RichText} from '@atproto/api'
import {useAnalytics} from 'lib/analytics/analytics'
import {useIsKeyboardVisible} from 'lib/hooks/useIsKeyboardVisible'
import {ExternalEmbed} from './ExternalEmbed'
import {Text} from '../util/text/Text'
import * as Toast from '../util/Toast'
// TODO: Prevent naming components that coincide with RN primitives
// due to linting false positives
import {TextInput, TextInputRef} from './text-input/TextInput'
import {CharProgress} from './char-progress/CharProgress'
import {UserAvatar} from '../util/UserAvatar'
import * as apilib from 'lib/api/index'
import {ComposerOpts} from 'state/shell/composer'
import {s, colors, gradients} from 'lib/styles'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {cleanError} from 'lib/strings/errors'
import {shortenLinks} from 'lib/strings/rich-text-manip'
import {toShortUrl} from 'lib/strings/url-helpers'
import {SelectPhotoBtn} from './photos/SelectPhotoBtn'
import {OpenCameraBtn} from './photos/OpenCameraBtn'
import {ThreadgateBtn} from './threadgate/ThreadgateBtn'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useExternalLinkFetch} from './useExternalLinkFetch'
import {isWeb, isNative, isAndroid, isIOS} from 'platform/detection'
import QuoteEmbed from '../util/post-embeds/QuoteEmbed'
import {GalleryModel} from 'state/models/media/gallery'
import {Gallery} from './photos/Gallery'
import {MAX_GRAPHEME_LENGTH} from 'lib/constants'
import {LabelsBtn} from './labels/LabelsBtn'
import {SelectLangBtn} from './select-language/SelectLangBtn'
import {EmojiPickerButton} from './text-input/web/EmojiPicker.web'
import {insertMentionAt} from 'lib/strings/mention-manip'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModals, useModalControls} from '#/state/modals'
import {useRequireAltTextEnabled} from '#/state/preferences'
import {
  useLanguagePrefs,
  useLanguagePrefsApi,
  toPostLanguages,
} from '#/state/preferences/languages'
import {useSession, getAgent} from '#/state/session'
import {useProfileQuery} from '#/state/queries/profile'
import {useComposerControls} from '#/state/shell/composer'
import {emitPostCreated} from '#/state/events'
import {ThreadgateSetting} from '#/state/queries/threadgate'

type Props = ComposerOpts
export const ComposePost = observer(function ComposePost({
  replyTo,
  onPost,
  quote: initQuote,
  mention: initMention,
}: Props) {
  const {currentAccount} = useSession()
  const {data: currentProfile} = useProfileQuery({did: currentAccount!.did})
  const {activeModals} = useModals()
  const {openModal, closeModal} = useModalControls()
  const {closeComposer} = useComposerControls()
  const {track} = useAnalytics()
  const pal = usePalette('default')
  const {isDesktop, isMobile} = useWebMediaQueries()
  const {_} = useLingui()
  const requireAltTextEnabled = useRequireAltTextEnabled()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const textInput = useRef<TextInputRef>(null)
  const [isKeyboardVisible] = useIsKeyboardVisible({iosUseWillEvents: true})
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingState, setProcessingState] = useState('')
  const [error, setError] = useState('')
  const [richtext, setRichText] = useState(
    new RichText({
      text: initMention
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
  const {extLink, setExtLink} = useExternalLinkFetch({setQuote})
  const [labels, setLabels] = useState<string[]>([])
  const [threadgate, setThreadgate] = useState<ThreadgateSetting[]>([])
  const [suggestedLinks, setSuggestedLinks] = useState<Set<string>>(new Set())
  const gallery = useMemo(() => new GalleryModel(), [])
  const onClose = useCallback(() => {
    closeComposer()
  }, [closeComposer])

  const insets = useSafeAreaInsets()
  const viewStyles = useMemo(
    () => ({
      paddingBottom:
        isAndroid || (isIOS && !isKeyboardVisible) ? insets.bottom : 0,
      paddingTop: isAndroid ? insets.top : isMobile ? 15 : 0,
    }),
    [insets, isKeyboardVisible, isMobile],
  )

  const onPressCancel = useCallback(() => {
    if (graphemeLength > 0 || !gallery.isEmpty) {
      if (activeModals.some(modal => modal.name === 'confirm')) {
        closeModal()
      }
      if (Keyboard) {
        Keyboard.dismiss()
      }
      openModal({
        name: 'confirm',
        title: _(msg`Discard draft`),
        onPressConfirm: onClose,
        onPressCancel: () => {
          closeModal()
        },
        message: _(msg`Are you sure you'd like to discard this draft?`),
        confirmBtnText: _(msg`Discard`),
        confirmBtnStyle: {backgroundColor: colors.red4},
      })
    } else {
      onClose()
    }
  }, [openModal, closeModal, activeModals, onClose, graphemeLength, gallery, _])
  // android back button
  useEffect(() => {
    if (!isAndroid) {
      return
    }
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onPressCancel()
        return true
      },
    )

    return () => {
      backHandler.remove()
    }
  }, [onPressCancel])

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
    if (isWeb) {
      window.addEventListener('keydown', onEscape)
      return () => window.removeEventListener('keydown', onEscape)
    }
  }, [onEscape])

  const onPressAddLinkCard = useCallback(
    (uri: string) => {
      setExtLink({uri, isLoading: true})
    },
    [setExtLink],
  )

  const onPhotoPasted = useCallback(
    async (uri: string) => {
      track('Composer:PastedPhotos')
      await gallery.paste(uri)
    },
    [gallery, track],
  )

  const onPressPublish = async () => {
    if (isProcessing || graphemeLength > MAX_GRAPHEME_LENGTH) {
      return
    }
    if (requireAltTextEnabled && gallery.needsAltText) {
      return
    }

    setError('')

    if (richtext.text.trim().length === 0 && gallery.isEmpty && !extLink) {
      setError('Did you want to say anything?')
      return
    }

    setIsProcessing(true)

    let postUri
    try {
      postUri = (
        await apilib.post(getAgent(), {
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
    } catch (e: any) {
      if (extLink) {
        setExtLink({
          ...extLink,
          isLoading: true,
          localThumb: undefined,
        } as apilib.ExternalEmbedDraft)
      }
      setError(cleanError(e.message))
      setIsProcessing(false)
      return
    } finally {
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
    Toast.show(`Your ${replyTo ? 'reply' : 'post'} has been published`)
  }

  const canPost = useMemo(
    () =>
      graphemeLength <= MAX_GRAPHEME_LENGTH &&
      (!requireAltTextEnabled || !gallery.needsAltText),
    [graphemeLength, requireAltTextEnabled, gallery.needsAltText],
  )
  const selectTextInputPlaceholder = replyTo ? 'Write your reply' : `What's up?`

  const canSelectImages = useMemo(() => gallery.size < 4, [gallery.size])
  const hasMedia = gallery.size > 0 || Boolean(extLink)

  return (
    <KeyboardAvoidingView
      testID="composePostView"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.outer}>
      <View style={[s.flex1, viewStyles]} aria-modal accessibilityViewIsModal>
        <View style={[styles.topbar, isDesktop && styles.topbarDesktop]}>
          <TouchableOpacity
            testID="composerDiscardButton"
            onPress={onPressCancel}
            onAccessibilityEscape={onPressCancel}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Cancel`)}
            accessibilityHint="Closes post composer and discards post draft">
            <Text style={[pal.link, s.f18]}>
              <Trans>Cancel</Trans>
            </Text>
          </TouchableOpacity>
          <View style={s.flex1} />
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
              {replyTo ? null : (
                <ThreadgateBtn
                  threadgate={threadgate}
                  onChange={setThreadgate}
                />
              )}
              {canPost ? (
                <TouchableOpacity
                  testID="composerPublishBtn"
                  onPress={onPressPublish}
                  accessibilityRole="button"
                  accessibilityLabel={
                    replyTo ? 'Publish reply' : 'Publish post'
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
                      {replyTo ? 'Reply' : 'Post'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={[styles.postBtn, pal.btn]}>
                  <Text style={[pal.textLight, s.f16, s.bold]}>
                    <Trans>Post</Trans>
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
        {requireAltTextEnabled && gallery.needsAltText && (
          <View style={[styles.reminderLine, pal.viewLight]}>
            <View style={styles.errorIcon}>
              <FontAwesomeIcon
                icon="exclamation"
                style={{color: colors.red4}}
                size={10}
              />
            </View>
            <Text style={[pal.text, s.flex1]}>
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
            <Text style={[s.red4, s.flex1]}>{error}</Text>
          </View>
        )}
        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="always">
          {replyTo ? (
            <View style={[pal.border, styles.replyToLayout]}>
              <UserAvatar avatar={replyTo.author.avatar} size={50} />
              <View style={styles.replyToPost}>
                <Text type="xl-medium" style={[pal.text]}>
                  {sanitizeDisplayName(
                    replyTo.author.displayName ||
                      sanitizeHandle(replyTo.author.handle),
                  )}
                </Text>
                <Text type="post-text" style={pal.text} numberOfLines={6}>
                  {replyTo.text}
                </Text>
              </View>
            </View>
          ) : undefined}

          <View
            style={[
              pal.border,
              styles.textInputLayout,
              isNative && styles.textInputLayoutMobile,
            ]}>
            <UserAvatar avatar={currentProfile?.avatar} size={50} />
            <TextInput
              ref={textInput}
              richtext={richtext}
              placeholder={selectTextInputPlaceholder}
              suggestedLinks={suggestedLinks}
              autoFocus={true}
              setRichText={setRichText}
              onPhotoPasted={onPhotoPasted}
              onPressPublish={onPressPublish}
              onSuggestedLinksChanged={setSuggestedLinks}
              onError={setError}
              accessible={true}
              accessibilityLabel={_(msg`Write post`)}
              accessibilityHint={`Compose posts up to ${MAX_GRAPHEME_LENGTH} characters in length`}
            />
          </View>

          <Gallery gallery={gallery} />
          {gallery.isEmpty && extLink && (
            <ExternalEmbed
              link={extLink}
              onRemove={() => setExtLink(undefined)}
            />
          )}
          {quote ? (
            <View style={[s.mt5, isWeb && s.mb10]}>
              <QuoteEmbed quote={quote} />
            </View>
          ) : undefined}
        </ScrollView>
        {!extLink && suggestedLinks.size > 0 ? (
          <View style={s.mb5}>
            {Array.from(suggestedLinks)
              .slice(0, 3)
              .map(url => (
                <TouchableOpacity
                  key={`suggested-${url}`}
                  testID="addLinkCardBtn"
                  style={[pal.borderDark, styles.addExtLinkBtn]}
                  onPress={() => onPressAddLinkCard(url)}
                  accessibilityRole="button"
                  accessibilityLabel={_(msg`Add link card`)}
                  accessibilityHint={`Creates a card with a thumbnail. The card links to ${url}`}>
                  <Text style={pal.text}>
                    <Trans>Add link card:</Trans>
                    <Text style={[pal.link, s.ml5]}>{toShortUrl(url)}</Text>
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        ) : null}
        <View style={[pal.border, styles.bottomBar]}>
          {canSelectImages ? (
            <>
              <SelectPhotoBtn gallery={gallery} />
              <OpenCameraBtn gallery={gallery} />
            </>
          ) : null}
          {isDesktop ? <EmojiPickerButton /> : null}
          <View style={s.flex1} />
          <SelectLangBtn />
          <CharProgress count={graphemeLength} />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
})

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'column',
    flex: 1,
    height: '100%',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 20,
    height: 55,
    gap: 4,
  },
  topbarDesktop: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  postBtn: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginLeft: 12,
  },
  errorLine: {
    flexDirection: 'row',
    backgroundColor: colors.red1,
    borderRadius: 6,
    marginHorizontal: 15,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 6,
  },
  reminderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 15,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  errorIcon: {
    borderWidth: 1,
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
    paddingHorizontal: 15,
  },
  textInputLayout: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  textInputLayoutMobile: {
    flex: 1,
  },
  replyToLayout: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 16,
  },
  replyToPost: {
    flex: 1,
    paddingLeft: 13,
    paddingRight: 8,
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
    paddingVertical: 10,
    paddingLeft: 15,
    paddingRight: 20,
    alignItems: 'center',
    borderTopWidth: 1,
  },
})
