import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
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
import {UserAutocompleteModel} from 'state/models/discovery/user-autocomplete'
import {useIsKeyboardVisible} from 'lib/hooks/useIsKeyboardVisible'
import {ExternalEmbed} from './ExternalEmbed'
import {Text} from '../util/text/Text'
import * as Toast from '../util/Toast'
// TODO: Prevent naming components that coincide with RN primitives
// due to linting false positives
import {TextInput, TextInputRef} from './text-input/TextInput'
import {CharProgress} from './char-progress/CharProgress'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from 'state/index'
import * as apilib from 'lib/api/index'
import {ComposerOpts} from 'state/models/ui/shell'
import {s, colors, gradients} from 'lib/styles'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {cleanError} from 'lib/strings/errors'
import {shortenLinks} from 'lib/strings/rich-text-manip'
import {toShortUrl} from 'lib/strings/url-helpers'
import {SelectPhotoBtn} from './photos/SelectPhotoBtn'
import {OpenCameraBtn} from './photos/OpenCameraBtn'
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

type Props = ComposerOpts & {
  onClose: () => void
}

export const ComposePost = observer(function ComposePost({
  replyTo,
  onPost,
  onClose,
  quote: initQuote,
  mention: initMention,
}: Props) {
  const {track} = useAnalytics()
  const pal = usePalette('default')
  const {isDesktop, isMobile} = useWebMediaQueries()
  const store = useStores()
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
  const [suggestedLinks, setSuggestedLinks] = useState<Set<string>>(new Set())
  const gallery = useMemo(() => new GalleryModel(store), [store])

  const autocompleteView = useMemo<UserAutocompleteModel>(
    () => new UserAutocompleteModel(store),
    [store],
  )

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
      if (store.shell.activeModals.some(modal => modal.name === 'confirm')) {
        store.shell.closeModal()
      }
      if (Keyboard) {
        Keyboard.dismiss()
      }
      store.shell.openModal({
        name: 'confirm',
        title: 'Discard draft',
        onPressConfirm: onClose,
        onPressCancel: () => {
          store.shell.closeModal()
        },
        message: "Are you sure you'd like to discard this draft?",
        confirmBtnText: 'Discard',
        confirmBtnStyle: {backgroundColor: colors.red4},
      })
    } else {
      onClose()
    }
  }, [store, onClose, graphemeLength, gallery])

  // initial setup
  useEffect(() => {
    autocompleteView.setup()
  }, [autocompleteView])

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
    if (store.preferences.requireAltTextEnabled && gallery.needsAltText) {
      return
    }

    setError('')

    if (richtext.text.trim().length === 0 && gallery.isEmpty) {
      setError('Did you want to say anything?')
      return
    }

    setIsProcessing(true)

    try {
      await apilib.post(store, {
        rawText: richtext.text,
        replyTo: replyTo?.uri,
        images: gallery.images,
        quote,
        extLink,
        labels,
        onStateChange: setProcessingState,
        knownHandles: autocompleteView.knownHandles,
        langs: store.preferences.postLanguages,
      })
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
    if (!replyTo) {
      store.me.mainFeed.onPostCreated()
    }
    store.preferences.savePostLanguageToHistory()
    onPost?.()
    onClose()
    Toast.show(`Your ${replyTo ? 'reply' : 'post'} has been published`)
  }

  const canPost = useMemo(
    () =>
      graphemeLength <= MAX_GRAPHEME_LENGTH &&
      (!store.preferences.requireAltTextEnabled || !gallery.needsAltText),
    [
      graphemeLength,
      store.preferences.requireAltTextEnabled,
      gallery.needsAltText,
    ],
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
            accessibilityLabel="Cancel"
            accessibilityHint="Closes post composer and discards post draft">
            <Text style={[pal.link, s.f18]}>Cancel</Text>
          </TouchableOpacity>
          <View style={s.flex1} />
          <LabelsBtn labels={labels} onChange={setLabels} hasMedia={hasMedia} />
          {isProcessing ? (
            <View style={styles.postBtn}>
              <ActivityIndicator />
            </View>
          ) : canPost ? (
            <TouchableOpacity
              testID="composerPublishBtn"
              onPress={onPressPublish}
              accessibilityRole="button"
              accessibilityLabel={replyTo ? 'Publish reply' : 'Publish post'}
              accessibilityHint={
                replyTo
                  ? 'Double tap to publish your reply'
                  : 'Double tap to publish your post'
              }>
              <LinearGradient
                colors={[gradients.blueLight.start, gradients.blueLight.end]}
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
              <Text style={[pal.textLight, s.f16, s.bold]}>Post</Text>
            </View>
          )}
        </View>
        {isProcessing ? (
          <View style={[pal.btn, styles.processingLine]}>
            <Text style={pal.text}>{processingState}</Text>
          </View>
        ) : undefined}
        {store.preferences.requireAltTextEnabled && gallery.needsAltText && (
          <View style={[styles.reminderLine, pal.viewLight]}>
            <View style={styles.errorIcon}>
              <FontAwesomeIcon
                icon="exclamation"
                style={{color: colors.red4}}
                size={10}
              />
            </View>
            <Text style={[pal.text, s.flex1]}>
              One or more images is missing alt text.
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
            <UserAvatar avatar={store.me.avatar} size={50} />
            <TextInput
              ref={textInput}
              richtext={richtext}
              placeholder={selectTextInputPlaceholder}
              suggestedLinks={suggestedLinks}
              autocompleteView={autocompleteView}
              autoFocus={true}
              setRichText={setRichText}
              onPhotoPasted={onPhotoPasted}
              onPressPublish={onPressPublish}
              onSuggestedLinksChanged={setSuggestedLinks}
              onError={setError}
              accessible={true}
              accessibilityLabel="Write post"
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
                  accessibilityLabel="Add link card"
                  accessibilityHint={`Creates a card with a thumbnail. The card links to ${url}`}>
                  <Text style={pal.text}>
                    Add link card:{' '}
                    <Text style={pal.link}>{toShortUrl(url)}</Text>
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
    paddingBottom: 4,
    paddingHorizontal: 20,
    height: 55,
  },
  topbarDesktop: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  postBtn: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  processingLine: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 15,
    marginBottom: 6,
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
