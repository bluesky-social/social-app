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
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UserAutocompleteViewModel} from '../../../state/models/user-autocomplete-view'
import {Autocomplete} from './Autocomplete'
import Toast from '../util/Toast'
import ProgressCircle from '../util/ProgressCircle'
import {useStores} from '../../../state'
import * as apilib from '../../../state/lib/api'
import {ComposerOpts} from '../../../state/models/shell-ui'
import {s, colors, gradients} from '../../lib/styles'

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
  const autocompleteView = useMemo<UserAutocompleteViewModel>(
    () => new UserAutocompleteViewModel(store),
    [],
  )

  useEffect(() => {
    autocompleteView.setup()
  })

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
    return (text || '').split(/(\s)/g).map((item, i) => {
      if (
        /^@[a-zA-Z0-9\.-]+$/g.test(item) &&
        autocompleteView.knownHandles.has(item.slice(1))
      ) {
        return (
          <Text key={i} style={{color: colors.blue3}}>
            {item}
          </Text>
        )
      }
      return item
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
        <TextInput
          multiline
          scrollEnabled
          autoFocus
          onChangeText={(text: string) => onChangeText(text)}
          placeholder={replyTo ? 'Write your reply' : "What's new?"}
          style={styles.textInput}>
          {textDecorated}
        </TextInput>
        <View
          style={[s.flexRow, {alignItems: 'center'}, s.pt10, s.pb10, s.pr5]}>
          <View style={s.flex1} />
          <Text style={[s.mr10, {color: progressColor}]}>
            {text.length} / {MAX_TEXT_LENGTH}
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

const atPrefixRegex = /@([\S]*)$/i
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
    fontSize: 18,
  },
})
