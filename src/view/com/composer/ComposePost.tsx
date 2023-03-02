import React, {useEffect, useMemo, useRef, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInputSelectionChangeEventData,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useAnalytics} from 'lib/analytics'
import _isEqual from 'lodash.isequal'
import {UserAutocompleteViewModel} from 'state/models/user-autocomplete-view'
import {Autocomplete} from './Autocomplete'
import {ExternalEmbed} from './ExternalEmbed'
import {Text} from '../util/text/Text'
import * as Toast from '../util/Toast'
import {TextInput, TextInputRef} from './text-input/TextInput'
import {CharProgress} from './char-progress/CharProgress'
import {TextLink} from '../util/Link'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from 'state/index'
import * as apilib from 'lib/api/index'
import {ComposerOpts} from 'state/models/shell-ui'
import {s, colors, gradients} from 'lib/styles'
import {cleanError} from 'lib/strings/errors'
import {detectLinkables, extractEntities} from 'lib/strings/rich-text-detection'
import {getLinkMeta} from 'lib/link-meta/link-meta'
import {getImageDim, downloadAndResize} from 'lib/media/manip'
import {PhotoCarouselPicker} from './photos/PhotoCarouselPicker'
import {cropAndCompressFlow, pickImagesFlow} from '../../../lib/media/picker'
import {getMentionAt, insertMentionAt} from 'lib/strings/mention-manip'
import {SelectedPhoto} from './SelectedPhoto'
import {usePalette} from 'lib/hooks/usePalette'
import {
  POST_IMG_MAX_WIDTH,
  POST_IMG_MAX_HEIGHT,
  POST_IMG_MAX_SIZE,
} from 'lib/constants'
import {isWeb} from 'platform/detection'
import QuoteEmbed from '../util/PostEmbeds/QuoteEmbed'

const MAX_TEXT_LENGTH = 256
const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

interface Selection {
  start: number
  end: number
}

export const ComposePost = observer(function ComposePost({
  replyTo,
  imagesOpen,
  onPost,
  onClose,
  quote,
}: {
  replyTo?: ComposerOpts['replyTo']
  imagesOpen?: ComposerOpts['imagesOpen']
  onPost?: ComposerOpts['onPost']
  onClose: () => void
  quote?: ComposerOpts['quote']
}) {
  const {track} = useAnalytics()
  const pal = usePalette('default')
  const store = useStores()
  const textInput = useRef<TextInputRef>(null)
  const textInputSelection = useRef<Selection>({start: 0, end: 0})
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingState, setProcessingState] = useState('')
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [extLink, setExtLink] = useState<apilib.ExternalEmbedDraft | undefined>(
    undefined,
  )
  const [suggestedExtLinks, setSuggestedExtLinks] = useState<Set<string>>(
    new Set(),
  )
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(
    imagesOpen || false,
  )
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])

  const autocompleteView = React.useMemo<UserAutocompleteViewModel>(
    () => new UserAutocompleteViewModel(store),
    [store],
  )

  // HACK
  // there's a bug with @mattermost/react-native-paste-input where if the input
  // is focused during unmount, an exception will throw (seems that a blur method isnt implemented)
  // manually blurring before closing gets around that
  // -prf
  const hackfixOnClose = () => {
    textInput.current?.blur()
    onClose()
  }

  // initial setup
  useEffect(() => {
    autocompleteView.setup()
  }, [autocompleteView])

  // external link metadata-fetch flow
  useEffect(() => {
    let aborted = false
    const cleanup = () => {
      aborted = true
    }
    if (!extLink) {
      return cleanup
    }
    if (!extLink.meta) {
      getLinkMeta(store, extLink.uri).then(meta => {
        if (aborted) {
          return
        }
        setExtLink({
          uri: extLink.uri,
          isLoading: !!meta.image,
          meta,
        })
      })
      return cleanup
    }
    if (extLink.isLoading && extLink.meta?.image && !extLink.localThumb) {
      downloadAndResize({
        uri: extLink.meta.image,
        width: 2000,
        height: 2000,
        mode: 'contain',
        maxSize: 1000000,
        timeout: 15e3,
      })
        .catch(() => undefined)
        .then(localThumb => {
          if (aborted) {
            return
          }
          setExtLink({
            ...extLink,
            isLoading: false, // done
            localThumb,
          })
        })
      return cleanup
    }
    if (extLink.isLoading) {
      setExtLink({
        ...extLink,
        isLoading: false, // done
      })
    }
    return cleanup
  }, [store, extLink])

  useEffect(() => {
    // HACK
    // wait a moment before focusing the input to resolve some layout bugs with the keyboard-avoiding-view
    // -prf
    let to: NodeJS.Timeout | undefined
    if (textInput.current) {
      to = setTimeout(() => {
        textInput.current?.focus()
      }, 250)
    }
    return () => {
      if (to) {
        clearTimeout(to)
      }
    }
  }, [])

  const onPressContainer = () => {
    textInput.current?.focus()
  }
  const onPressSelectPhotos = async () => {
    track('ComposePost:SelectPhotos')
    if (isWeb) {
      if (selectedPhotos.length < 4) {
        const images = await pickImagesFlow(
          store,
          4 - selectedPhotos.length,
          {width: POST_IMG_MAX_WIDTH, height: POST_IMG_MAX_HEIGHT},
          POST_IMG_MAX_SIZE,
        )
        setSelectedPhotos([...selectedPhotos, ...images])
      }
    } else {
      if (isSelectingPhotos) {
        setIsSelectingPhotos(false)
      } else if (selectedPhotos.length < 4) {
        setIsSelectingPhotos(true)
      }
    }
  }
  const onSelectPhotos = (photos: string[]) => {
    track('ComposePost:SelectPhotos:Done')
    setSelectedPhotos(photos)
    if (photos.length >= 4) {
      setIsSelectingPhotos(false)
    }
  }
  const onPressAddLinkCard = (uri: string) => {
    setExtLink({uri, isLoading: true})
  }
  const onChangeText = (newText: string) => {
    setText(newText)

    const prefix = getMentionAt(newText, textInputSelection.current?.start || 0)
    if (prefix) {
      autocompleteView.setActive(true)
      autocompleteView.setPrefix(prefix.value)
    } else {
      autocompleteView.setActive(false)
    }

    if (!extLink) {
      const ents = extractEntities(newText)?.filter(ent => ent.type === 'link')
      const set = new Set(ents ? ents.map(e => e.value) : [])
      if (!_isEqual(set, suggestedExtLinks)) {
        setSuggestedExtLinks(set)
      }
    }
  }
  const onPaste = async (err: string | undefined, uris: string[]) => {
    if (err) {
      return setError(cleanError(err))
    }
    if (selectedPhotos.length >= 4) {
      return
    }
    const imgUri = uris.find(uri => /\.(jpe?g|png)$/.test(uri))
    if (imgUri) {
      let imgDim
      try {
        imgDim = await getImageDim(imgUri)
      } catch (e) {
        imgDim = {width: POST_IMG_MAX_WIDTH, height: POST_IMG_MAX_HEIGHT}
      }
      const finalImgPath = await cropAndCompressFlow(
        store,
        imgUri,
        imgDim,
        {width: POST_IMG_MAX_WIDTH, height: POST_IMG_MAX_HEIGHT},
        POST_IMG_MAX_SIZE,
      )
      onSelectPhotos([...selectedPhotos, finalImgPath])
    }
  }
  const onSelectionChange = (
    evt: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    // NOTE we track the input selection using a ref to avoid excessive renders -prf
    textInputSelection.current = evt.nativeEvent.selection
  }
  const onSelectAutocompleteItem = (item: string) => {
    setText(insertMentionAt(text, textInputSelection.current?.start || 0, item))
    autocompleteView.setActive(false)
  }
  const onPressCancel = () => hackfixOnClose()
  const onPressPublish = async () => {
    if (isProcessing) {
      return
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return
    }
    setError('')
    if (text.trim().length === 0 && selectedPhotos.length === 0) {
      setError('Did you want to say anything?')
      return false
    }
    setIsProcessing(true)
    try {
      await apilib.post(store, {
        rawText: text,
        replyTo: replyTo?.uri,
        images: selectedPhotos,
        quote: quote,
        extLink: extLink,
        onStateChange: setProcessingState,
        knownHandles: autocompleteView.knownHandles,
      })
      track('Create Post', {
        imageCount: selectedPhotos.length,
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
    }
    store.me.mainFeed.loadLatest()
    onPost?.()
    hackfixOnClose()
    Toast.show(`Your ${replyTo ? 'reply' : 'post'} has been published`)
  }

  const canPost = text.length <= MAX_TEXT_LENGTH

  const selectTextInputLayout =
    selectedPhotos.length !== 0
      ? styles.textInputLayoutWithPhoto
      : styles.textInputLayoutWithoutPhoto
  const selectTextInputPlaceholder = replyTo
    ? 'Write your reply'
    : selectedPhotos.length !== 0
    ? 'Write a comment'
    : "What's up?"

  const textDecorated = useMemo(() => {
    let i = 0
    return detectLinkables(text).map(v => {
      if (typeof v === 'string') {
        return (
          <Text key={i++} style={[pal.text, styles.textInputFormatting]}>
            {v}
          </Text>
        )
      } else {
        return (
          <Text key={i++} style={[pal.link, styles.textInputFormatting]}>
            {v.link}
          </Text>
        )
      }
    })
  }, [text, pal.link, pal.text])

  return (
    <KeyboardAvoidingView
      testID="composePostView"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.outer}>
      <TouchableWithoutFeedback onPressIn={onPressContainer}>
        <SafeAreaView style={s.flex1}>
          <View style={styles.topbar}>
            <TouchableOpacity
              testID="composerCancelButton"
              onPress={onPressCancel}>
              <Text style={[pal.link, s.f18]}>Cancel</Text>
            </TouchableOpacity>
            <View style={s.flex1} />
            {isProcessing ? (
              <View style={styles.postBtn}>
                <ActivityIndicator />
              </View>
            ) : canPost ? (
              <TouchableOpacity
                testID="composerPublishButton"
                onPress={onPressPublish}>
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
          <ScrollView style={s.flex1}>
            {replyTo ? (
              <View style={[pal.border, styles.replyToLayout]}>
                <UserAvatar
                  handle={replyTo.author.handle}
                  displayName={replyTo.author.displayName}
                  avatar={replyTo.author.avatar}
                  size={50}
                />
                <View style={styles.replyToPost}>
                  <TextLink
                    type="xl-medium"
                    href={`/profile/${replyTo.author.handle}`}
                    text={replyTo.author.displayName || replyTo.author.handle}
                    style={[pal.text]}
                  />
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
                selectTextInputLayout,
              ]}>
              <UserAvatar
                handle={store.me.handle || ''}
                displayName={store.me.displayName}
                avatar={store.me.avatar}
                size={50}
              />
              <TextInput
                testID="composerTextInput"
                innerRef={textInput}
                onChangeText={(str: string) => onChangeText(str)}
                onPaste={onPaste}
                onSelectionChange={onSelectionChange}
                placeholder={selectTextInputPlaceholder}
                style={[
                  pal.text,
                  styles.textInput,
                  styles.textInputFormatting,
                ]}>
                {textDecorated}
              </TextInput>
            </View>

            {quote ? (
              <View style={s.mt5}>
                <QuoteEmbed quote={quote} />
              </View>
            ) : undefined}

            <SelectedPhoto
              selectedPhotos={selectedPhotos}
              onSelectPhotos={onSelectPhotos}
            />
            {!selectedPhotos.length && extLink && (
              <ExternalEmbed
                link={extLink}
                onRemove={() => setExtLink(undefined)}
              />
            )}
          </ScrollView>
          {isSelectingPhotos && selectedPhotos.length < 4 ? (
            <PhotoCarouselPicker
              selectedPhotos={selectedPhotos}
              onSelectPhotos={onSelectPhotos}
            />
          ) : !extLink &&
            selectedPhotos.length === 0 &&
            suggestedExtLinks.size > 0 &&
            !quote ? (
            <View style={s.mb5}>
              {Array.from(suggestedExtLinks).map(url => (
                <TouchableOpacity
                  key={`suggested-${url}`}
                  style={[pal.borderDark, styles.addExtLinkBtn]}
                  onPress={() => onPressAddLinkCard(url)}>
                  <Text style={pal.text}>
                    Add link card: <Text style={pal.link}>{url}</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <View style={[pal.border, styles.bottomBar]}>
            {quote ? undefined : (
              <TouchableOpacity
                testID="composerSelectPhotosButton"
                onPress={onPressSelectPhotos}
                style={[s.pl5]}
                hitSlop={HITSLOP}>
                <FontAwesomeIcon
                  icon={['far', 'image']}
                  style={
                    (selectedPhotos.length < 4
                      ? pal.link
                      : pal.textLight) as FontAwesomeIconStyle
                  }
                  size={24}
                />
              </TouchableOpacity>
            )}
            <View style={s.flex1} />
            <CharProgress count={text.length} />
          </View>
          <Autocomplete
            active={autocompleteView.isActive}
            items={autocompleteView.suggestions}
            onSelect={onSelectAutocompleteItem}
          />
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
})

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'column',
    flex: 1,
    padding: 15,
    height: '100%',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 5,
    height: 55,
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
    marginBottom: 6,
  },
  errorLine: {
    flexDirection: 'row',
    backgroundColor: colors.red1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 6,
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
  textInputLayoutWithPhoto: {
    flexWrap: 'wrap',
  },
  textInputLayoutWithoutPhoto: {
    flex: 1,
  },
  textInputLayout: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  textInput: {
    flex: 1,
    padding: 5,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  textInputFormatting: {
    fontSize: 18,
    letterSpacing: 0.2,
    fontWeight: '400',
    lineHeight: 23.4, // 1.3*16
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
    marginBottom: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingRight: 5,
    alignItems: 'center',
    borderTopWidth: 1,
  },
})
