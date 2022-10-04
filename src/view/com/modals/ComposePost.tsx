import React, {useEffect, useMemo, useState} from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {BottomSheetTextInput} from '@gorhom/bottom-sheet'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import * as GetUserFollows from '../../../third-party/api/src/types/todo/social/getUserFollows'
import {Autocomplete} from './composer/Autocomplete'
import Toast from '../util/Toast'
import ProgressCircle from '../util/ProgressCircle'
import {useStores} from '../../../state'
import * as apilib from '../../../state/lib/api'
import {s, colors, gradients} from '../../lib/styles'

const MAX_TEXT_LENGTH = 256
const WARNING_TEXT_LENGTH = 200
const DANGER_TEXT_LENGTH = 255
export const snapPoints = ['100%']

export function Component({
  replyTo,
  onPost,
}: {
  replyTo?: string
  onPost?: () => void
}) {
  const store = useStores()
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [followedUsers, setFollowedUsers] = useState<
    undefined | GetUserFollows.OutputSchema['follows']
  >(undefined)
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>([])

  useEffect(() => {
    store.api.todo.social
      .getUserFollows({
        user: store.me.did || '',
      })
      .then(res => {
        setFollowedUsers(res.data.follows)
      })
  })

  const onChangeText = (newText: string) => {
    if (newText.length > MAX_TEXT_LENGTH) {
      newText = newText.slice(0, MAX_TEXT_LENGTH)
    }
    setText(newText)

    const prefix = extractTextAutocompletePrefix(newText)
    if (typeof prefix === 'string' && followedUsers) {
      setAutocompleteOptions(
        [prefix].concat(
          followedUsers
            .filter(user => user.name.startsWith(prefix))
            .map(user => user.name),
        ),
      )
    } else if (autocompleteOptions) {
      setAutocompleteOptions([])
    }
  }
  const onPressCancel = () => {
    store.shell.closeModal()
  }
  const onPressPublish = async () => {
    setError('')
    if (text.trim().length === 0) {
      setError('Did you want to say anything?')
      return false
    }
    try {
      await apilib.post(store, text, replyTo)
    } catch (e: any) {
      console.error(`Failed to create post: ${e.toString()}`)
      setError(
        'Post failed to upload. Please check your Internet connection and try again.',
      )
      return
    }
    onPost?.()
    store.shell.closeModal()
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
    setAutocompleteOptions([])
  }

  const progressColor =
    text.length > DANGER_TEXT_LENGTH
      ? '#e60000'
      : text.length > WARNING_TEXT_LENGTH
      ? '#f7c600'
      : undefined

  const textDecorated = useMemo(() => {
    return (text || '').split(/(\s)/g).map((item, i) => {
      if (/^@[a-zA-Z0-9\.-]+$/g.test(item)) {
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
    <View style={styles.outer}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={onPressCancel}>
          <Text style={[s.blue3, s.f16]}>Cancel</Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        <TouchableOpacity onPress={onPressPublish}>
          <LinearGradient
            colors={[gradients.primary.start, gradients.primary.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.postBtn}>
            <Text style={[s.white, s.f16, s.bold]}>Post</Text>
          </LinearGradient>
        </TouchableOpacity>
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
      <BottomSheetTextInput
        multiline
        scrollEnabled
        autoFocus
        onChangeText={(text: string) => onChangeText(text)}
        placeholder={replyTo ? 'Write your reply' : "What's new?"}
        style={styles.textInput}>
        {textDecorated}
      </BottomSheetTextInput>
      <View style={[s.flexRow, s.pt10, s.pb10, s.pr5]}>
        <View style={s.flex1} />
        <View>
          <ProgressCircle
            color={progressColor}
            progress={text.length / MAX_TEXT_LENGTH}
          />
        </View>
      </View>
      <Autocomplete
        active={autocompleteOptions.length > 0}
        items={autocompleteOptions}
        onSelect={onSelectAutocompleteItem}
      />
    </View>
  )
}

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
