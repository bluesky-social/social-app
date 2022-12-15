import React, {useEffect, useMemo, useRef, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UserAutocompleteViewModel} from '../../../state/models/user-autocomplete-view'
import {Autocomplete} from './Autocomplete'
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
import {detectLinkables} from '../../../lib/strings'
import {UserLocalPhotosModel} from '../../../state/models/user-local-photos'
import {PhotoCarouselPicker} from './PhotoCarouselPicker'
import {SelectedPhoto} from './SelectedPhoto'

const MAX_TEXT_LENGTH = 256
const DANGER_TEXT_LENGTH = MAX_TEXT_LENGTH
const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

export const ComposePost = observer(function ComposePost({
  replyTo,
  onPost,
  onClose,
}: {
  replyTo?: ComposerOpts['replyTo']
  onPost?: ComposerOpts['onPost']
  onClose: () => void
}) {
  const store = useStores()
  const textInput = useRef<TextInput>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingState, setProcessingState] = useState('')
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])

  const autocompleteView = useMemo<UserAutocompleteViewModel>(
    () => new UserAutocompleteViewModel(store),
    [store],
  )
  const localPhotos = useMemo<UserLocalPhotosModel>(
    () => new UserLocalPhotosModel(store),
    [store],
  )

  useEffect(() => {
    autocompleteView.setup()
    localPhotos.setup()
  }, [autocompleteView, localPhotos])

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

  const onPressSelectPhotos = () => {
    if (isSelectingPhotos) {
      setIsSelectingPhotos(false)
    } else if (selectedPhotos.length < 4) {
      setIsSelectingPhotos(true)
    }
  }
  const onSelectPhotos = (photos: string[]) => {
    setSelectedPhotos(photos)
    setIsSelectingPhotos(false)
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
  }
  const onPressCancel = () => {
    onClose()
  }
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
        selectedPhotos,
        autocompleteView.knownHandles,
        setProcessingState,
      )
    } catch (e: any) {
      setError(e.message)
      setIsProcessing(false)
      return
    }
    store.me.mainFeed.loadLatest()
    onPost?.()
    onClose()
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
        return v
      } else {
        return (
          <Text key={i++} style={{color: colors.blue3}}>
            {v.link}
          </Text>
        )
      }
    })
  }, [text])

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.outer}>
      <SafeAreaView style={s.flex1}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={onPressCancel}>
            <Text style={[s.blue3, s.f18]}>Cancel</Text>
          </TouchableOpacity>
          <View style={s.flex1} />
          {isProcessing ? (
            <View style={styles.postBtn}>
              <ActivityIndicator />
            </View>
          ) : canPost ? (
            <TouchableOpacity onPress={onPressPublish}>
              <LinearGradient
                colors={[gradients.primary.start, gradients.primary.end]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.postBtn}>
                <Text style={[s.white, s.f16, s.bold]}>
                  {replyTo ? 'Reply' : 'Post'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={[styles.postBtn, {backgroundColor: colors.gray1}]}>
              <Text style={[s.gray5, s.f16, s.bold]}>Post</Text>
            </View>
          )}
        </View>
        {isProcessing ? (
          <View style={styles.processingLine}>
            <Text>{processingState}</Text>
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
            <View style={styles.replyToLayout}>
              <UserAvatar
                handle={replyTo.author.handle}
                displayName={replyTo.author.displayName}
                avatar={replyTo.author.avatar}
                size={50}
              />
              <View style={styles.replyToPost}>
                <TextLink
                  href={`/profile/${replyTo.author.handle}`}
                  text={replyTo.author.displayName || replyTo.author.handle}
                  style={[s.f16, s.bold, s.black]}
                />
                <Text style={[s.f16, s['lh16-1.3'], s.black]} numberOfLines={6}>
                  {replyTo.text}
                </Text>
              </View>
            </View>
          ) : undefined}
          <View style={[styles.textInputLayout, selectTextInputLayout]}>
            <UserAvatar
              handle={store.me.handle || ''}
              displayName={store.me.displayName}
              avatar={store.me.avatar}
              size={50}
            />
            <TextInput
              ref={textInput}
              multiline
              scrollEnabled
              onChangeText={(text: string) => onChangeText(text)}
              placeholder={selectTextInputPlaceholder}
              style={styles.textInput}>
              {textDecorated}
            </TextInput>
          </View>
          <SelectedPhoto
            selectedPhotos={selectedPhotos}
            onSelectPhotos={onSelectPhotos}
          />
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
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={onPressSelectPhotos}
            style={[s.pl5]}
            hitSlop={HITSLOP}>
            <FontAwesomeIcon
              icon={['far', 'image']}
              style={{
                color: selectedPhotos.length < 4 ? colors.blue3 : colors.gray3,
              }}
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
    </KeyboardAvoidingView>
  )
})

const atPrefixRegex = /@([a-z0-9\.]*)$/i
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
    backgroundColor: '#fff',
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
    backgroundColor: colors.gray1,
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
    borderTopColor: colors.gray2,
    paddingTop: 16,
  },
  textInput: {
    flex: 1,
    padding: 5,
    fontSize: 18,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  replyToLayout: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
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
    borderTopColor: colors.gray2,
    backgroundColor: colors.white,
  },
})
