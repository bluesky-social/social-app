import React, {useEffect, useMemo, useRef, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import PasteInput, {
  PastedFile,
  PasteInputRef,
} from '@mattermost/react-native-paste-input'
import LinearGradient from 'react-native-linear-gradient'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useAnalytics} from '@segment/analytics-react-native'
import {UserAutocompleteViewModel} from '../../../state/models/user-autocomplete-view'
import {Autocomplete} from './Autocomplete'
import {ExternalEmbed} from './ExternalEmbed'
import {Text} from '../util/text/Text'
import * as Toast from '../util/Toast'
// @ts-ignore no type definition -prf
import ProgressCircle from 'react-native-progress/Circle'
// @ts-ignore no type definition -prf
import ProgressPie from 'react-native-progress/Pie'
import {TextLink} from '../util/Link'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from '../../../state'
import * as apilib from '../../../state/lib/api'
import {ComposerOpts} from '../../../state/models/shell-ui'
import {s, colors, gradients} from '../../lib/styles'
import {
  detectLinkables,
  extractEntities,
  cleanError,
} from '../../../lib/strings'
import {getLinkMeta} from '../../../lib/link-meta'
import {downloadAndResize} from '../../../lib/images'
import {UserLocalPhotosModel} from '../../../state/models/user-local-photos'
import {PhotoCarouselPicker, cropPhoto} from './PhotoCarouselPicker'
import {SelectedPhoto} from './SelectedPhoto'
import {usePalette} from '../../lib/hooks/usePalette'

const MAX_TEXT_LENGTH = 256
const DANGER_TEXT_LENGTH = MAX_TEXT_LENGTH
const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

export const ComposePost = observer(function ComposePost({
  replyTo,
  imagesOpen,
  onPost,
  onClose,
}: {
  replyTo?: ComposerOpts['replyTo']
  imagesOpen?: ComposerOpts['imagesOpen']
  onPost?: ComposerOpts['onPost']
  onClose: () => void
}) {
  const {track} = useAnalytics()
  const pal = usePalette('default')
  const store = useStores()
  const textInput = useRef<PasteInputRef>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingState, setProcessingState] = useState('')
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [extLink, setExtLink] = useState<apilib.ExternalEmbedDraft | undefined>(
    undefined,
  )
  const [attemptedExtLinks, setAttemptedExtLinks] = useState<string[]>([])
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(
    imagesOpen || false,
  )
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])

  // Using default import (React.use...) instead of named import (use...) to be able to mock store's data in jest environment
  const autocompleteView = React.useMemo<UserAutocompleteViewModel>(
    () => new UserAutocompleteViewModel(store),
    [store],
  )
  const localPhotos = React.useMemo<UserLocalPhotosModel>(
    () => new UserLocalPhotosModel(store),
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
    localPhotos.setup()
  }, [autocompleteView, localPhotos])

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
        width: 250,
        height: 250,
        mode: 'contain',
        maxSize: 100000,
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
  const onPressSelectPhotos = () => {
    if (isSelectingPhotos) {
      setIsSelectingPhotos(false)
    } else if (selectedPhotos.length < 4) {
      setIsSelectingPhotos(true)
    }
  }
  const onSelectPhotos = (photos: string[]) => {
    setSelectedPhotos(photos)
    if (photos.length >= 4) {
      setIsSelectingPhotos(false)
    }
  }
  const onChangeText = (newText: string) => {
    setText(newText)

    const prefix = extractTextAutocompletePrefix(newText)
    if (typeof prefix === 'string') {
      autocompleteView.setActive(true)
      autocompleteView.setPrefix(prefix)
    } else {
      autocompleteView.setActive(false)
    }

    if (!extLink && /\s$/.test(newText)) {
      const ents = extractEntities(newText)
      const entLink = ents
        ?.filter(
          ent => ent.type === 'link' && !attemptedExtLinks.includes(ent.value),
        )
        .pop() // use last
      if (entLink) {
        setExtLink({
          uri: entLink.value,
          isLoading: true,
        })
        setAttemptedExtLinks([...attemptedExtLinks, entLink.value])
      }
    }
  }
  const onPaste = async (err: string | undefined, files: PastedFile[]) => {
    if (err) {
      return setError(cleanError(err))
    }
    if (selectedPhotos.length >= 4) {
      return
    }
    const imgFile = files.find(file => /\.(jpe?g|png)$/.test(file.fileName))
    if (!imgFile) {
      return
    }
    const finalImgPath = await cropPhoto(imgFile.uri)
    onSelectPhotos([...selectedPhotos, finalImgPath])
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
      await apilib.post(
        store,
        text,
        replyTo?.uri,
        extLink,
        selectedPhotos,
        autocompleteView.knownHandles,
        setProcessingState,
      )
      track('Create Post', {
        imageCount: selectedPhotos.length,
      })
    } catch (e: any) {
      setError(cleanError(e.message))
      setIsProcessing(false)
      return
    }
    store.me.mainFeed.loadLatest()
    onPost?.()
    hackfixOnClose()
    Toast.show(`Your ${replyTo ? 'reply' : 'post'} has been published`)
  }
  const onSelectAutocompleteItem = (item: string) => {
    setText(replaceTextAutocompletePrefix(text, item))
    autocompleteView.setActive(false)
  }

  const canPost = text.length <= MAX_TEXT_LENGTH
  const progressColor = text.length > DANGER_TEXT_LENGTH ? '#e60000' : undefined

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
      style={[pal.view, styles.outer]}>
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
              <Text style={s.black}>{processingState}</Text>
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
              <PasteInput
                testID="composerTextInput"
                ref={textInput}
                multiline
                scrollEnabled
                onChangeText={(str: string) => onChangeText(str)}
                onPaste={onPaste}
                placeholder={selectTextInputPlaceholder}
                placeholderTextColor={pal.colors.textLight}
                style={[
                  pal.text,
                  styles.textInput,
                  styles.textInputFormatting,
                ]}>
                {textDecorated}
              </PasteInput>
            </View>
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
          {isSelectingPhotos &&
            localPhotos.photos != null &&
            selectedPhotos.length < 4 && (
              <PhotoCarouselPicker
                selectedPhotos={selectedPhotos}
                onSelectPhotos={onSelectPhotos}
                localPhotos={localPhotos}
              />
            )}
          <View style={[pal.border, styles.bottomBar]}>
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
            <View style={s.flex1} />
            <Text style={[s.mr10, {color: progressColor}]}>
              {MAX_TEXT_LENGTH - text.length}
            </Text>
            <View>
              {text.length > DANGER_TEXT_LENGTH ? (
                <ProgressPie
                  size={30}
                  borderWidth={4}
                  borderColor={progressColor}
                  color={progressColor}
                  progress={Math.min(
                    (text.length - MAX_TEXT_LENGTH) / MAX_TEXT_LENGTH,
                    1,
                  )}
                />
              ) : (
                <ProgressCircle
                  size={30}
                  borderWidth={1}
                  borderColor={colors.gray2}
                  color={progressColor}
                  progress={text.length / MAX_TEXT_LENGTH}
                />
              )}
            </View>
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

const atPrefixRegex = /@([a-z0-9.]*)$/i
function extractTextAutocompletePrefix(text: string) {
  const match = atPrefixRegex.exec(text)
  if (match) {
    return match[1]
  }
  return undefined
}
function replaceTextAutocompletePrefix(text: string, item: string) {
  return text.replace(atPrefixRegex, `@${item} `)
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'column',
    flex: 1,
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 0 : 50,
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
  bottomBar: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingRight: 5,
    alignItems: 'center',
    borderTopWidth: 1,
  },
})
