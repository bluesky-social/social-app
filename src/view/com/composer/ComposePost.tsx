import React, {useEffect, useMemo, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UserAutocompleteViewModel} from '../../../state/models/user-autocomplete-view'
import {UserLocalPhotosModel} from '../../../state/models/user-local-photos'
import {Autocomplete} from './Autocomplete'
import Toast from '../util/Toast'
import ProgressCircle from '../util/ProgressCircle'
import {TextLink} from '../util/Link'
import {useStores} from '../../../state'
import * as apilib from '../../../state/lib/api'
import {ComposerOpts} from '../../../state/models/shell-ui'
import {s, colors, gradients} from '../../lib/styles'
import {detectLinkables} from '../../../lib/strings'
import {openPicker, openCamera} from 'react-native-image-crop-picker'

const MAX_TEXT_LENGTH = 256
const WARNING_TEXT_LENGTH = 200
const DANGER_TEXT_LENGTH = MAX_TEXT_LENGTH

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
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [photoUris, setPhotoUris] = useState<string[]>([])
  const autocompleteView = useMemo<UserAutocompleteViewModel>(
    () => new UserAutocompleteViewModel(store),
    [],
  )
  const localPhotos = useMemo<UserLocalPhotosModel>(
    () => new UserLocalPhotosModel(store),
    [],
  )

  useEffect(() => {
    autocompleteView.setup()
  })

  useEffect(() => {
    localPhotos.setup()
  }, [])

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
    if (text.trim().length === 0) {
      setError('Did you want to say anything?')
      return false
    }
    setIsProcessing(true)
    try {
      await apilib.post(store, text, replyTo, autocompleteView.knownHandles)
    } catch (e: any) {
      console.error(`Failed to create post: ${e.toString()}`)
      setError(
        'Post failed to upload. Please check your Internet connection and try again.',
      )
      setIsProcessing(false)
      return
    }
    onPost?.()
    onClose()
    Toast.show(`Your ${replyTo ? 'reply' : 'post'} has been published`, {
      duration: Toast.durations.LONG,
      position: Toast.positions.TOP,
      shadow: true,
      animation: true,
      hideOnPress: true,
    })
  }
  const onSelectAutocompleteItem = (item: string) => {
    setText(replaceTextAutocompletePrefix(text, item))
    autocompleteView.setActive(false)
  }

  const canPost = text.length <= MAX_TEXT_LENGTH
  const progressColor =
    text.length > DANGER_TEXT_LENGTH
      ? '#e60000'
      : text.length > WARNING_TEXT_LENGTH
      ? '#f7c600'
      : undefined

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
    <KeyboardAvoidingView behavior="padding" style={styles.outer}>
      <SafeAreaView style={s.flex1}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={onPressCancel}>
            <Text style={[s.blue3, s.f16]}>Cancel</Text>
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
                <Text style={[s.white, s.f16, s.bold]}>Post</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={[styles.postBtn, {backgroundColor: colors.gray1}]}>
              <Text style={[s.gray5, s.f16, s.bold]}>Post</Text>
            </View>
          )}
        </View>
        {error !== '' && (
          <View style={styles.errorLine}>
            <View style={styles.errorIcon}>
              <FontAwesomeIcon
                icon="exclamation"
                style={{color: colors.red4}}
                size={10}
              />
            </View>
            <Text style={s.red4}>{error}</Text>
          </View>
        )}
        {replyTo ? (
          <View>
            <Text style={s.gray4}>
              Replying to{' '}
              <TextLink
                href={`/profile/${replyTo.author.handle}`}
                text={'@' + replyTo.author.handle}
                style={[s.bold, s.gray5]}
              />
            </Text>
            <View style={styles.replyToPost}>
              <Text style={s.gray5}>{replyTo.text}</Text>
            </View>
          </View>
        ) : undefined}
        <TextInput
          multiline
          scrollEnabled
          onChangeText={(text: string) => onChangeText(text)}
          placeholder={
            replyTo
              ? 'Write your reply'
              : photoUris.length === 0
              ? "What's up?"
              : 'Add a comment...'
          }
          style={styles.textInput}>
          {textDecorated}
        </TextInput>
        {photoUris.length !== 0 && (
          <View style={styles.selectedImageContainer}>
            {photoUris.length !== 0 &&
              photoUris.map(item => (
                <View
                  style={[
                    styles.selectedImage,
                    photoUris.length === 1
                      ? styles.selectedImage250
                      : photoUris.length === 2
                      ? styles.selectedImage175
                      : styles.selectedImage85,
                  ]}>
                  <TouchableOpacity
                    onPress={() => {
                      setPhotoUris(
                        photoUris.filter(filterItem => filterItem !== item),
                      )
                    }}
                    style={styles.removePhotoButton}>
                    <FontAwesomeIcon
                      icon="xmark"
                      size={16}
                      style={{color: colors.white}}
                    />
                  </TouchableOpacity>

                  <Image
                    style={[
                      styles.selectedImage,
                      photoUris.length === 1
                        ? styles.selectedImage250
                        : photoUris.length === 2
                        ? styles.selectedImage175
                        : styles.selectedImage85,
                    ]}
                    source={{uri: item}}
                  />
                </View>
              ))}
          </View>
        )}
        {localPhotos.photos != null && text === '' && photoUris.length === 0 && (
          <ScrollView
            horizontal
            style={styles.photosContainer}
            showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.galleryButton, styles.photo]}
              onPress={() => {
                openCamera({multiple: true, maxFiles: 4}).then()
              }}>
              <FontAwesomeIcon
                icon="camera"
                size={24}
                style={{color: colors.blue3}}
              />
            </TouchableOpacity>
            {localPhotos.photos.map(item => (
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => {
                  setPhotoUris([item.node.image.uri, ...photoUris])
                }}>
                <Image
                  style={styles.photo}
                  source={{uri: item.node.image.uri}}
                />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.galleryButton, styles.photo]}
              onPress={() => {
                openPicker({multiple: true, maxFiles: 4}).then(items => {
                  setPhotoUris([
                    ...items.reduce(
                      (accum, cur) => accum.concat(cur.sourceURL!),
                      [] as string[],
                    ),
                    ...photoUris,
                  ])
                })
              }}>
              <FontAwesomeIcon
                icon="image"
                style={{color: colors.blue3}}
                size={24}
              />
            </TouchableOpacity>
          </ScrollView>
        )}
        <View style={styles.separator} />
        <View style={[s.flexRow, s.pt10, s.pb10, s.pr5, styles.contentCenter]}>
          <View style={s.flex1} />
          <Text style={[s.mr10, {color: progressColor}]}>
            {MAX_TEXT_LENGTH - text.length}
          </Text>
          <View>
            <ProgressCircle
              color={progressColor}
              progress={text.length / MAX_TEXT_LENGTH}
            />
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
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 5,
    height: 50,
  },
  postBtn: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
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
  textInput: {
    flex: 1,
    padding: 5,
    fontSize: 21,
  },
  replyToPost: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 6,
    marginTop: 5,
    marginBottom: 10,
  },
  contentCenter: {alignItems: 'center'},
  selectedImageContainer: {
    flex: 10,
    flexDirection: 'row',
  },
  selectedImage: {
    borderRadius: 8,
    margin: 2,
  },
  selectedImage250: {
    width: 250,
    height: 250,
  },
  selectedImage175: {
    width: 175,
    height: 175,
  },
  selectedImage85: {
    width: 85,
    height: 85,
  },
  photosContainer: {
    width: '100%',
    maxHeight: 96,
    padding: 8,
    overflow: 'hidden',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
    zIndex: 1,
  },
  galleryButton: {
    borderWidth: 1,
    borderColor: colors.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButton: {
    width: 75,
    height: 75,
    marginRight: 8,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: colors.gray3,
  },
  photo: {
    width: 75,
    height: 75,
    marginRight: 8,
    borderRadius: 16,
  },
  separator: {
    borderBottomColor: 'black',
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '110%',
    marginLeft: -16,
  },
})
