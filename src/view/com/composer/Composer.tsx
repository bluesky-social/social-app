import React, {useState, forwardRef, useImperativeHandle} from 'react'
import {KeyboardAvoidingView, StyleSheet, TextInput, View} from 'react-native'
import Toast from '../util/Toast'
import ProgressCircle from '../util/ProgressCircle'
import {useStores} from '../../../state'
import {s} from '../../lib/styles'
import * as apilib from '../../../state/lib/api'

const MAX_TEXT_LENGTH = 256
const WARNING_TEXT_LENGTH = 200
const DANGER_TEXT_LENGTH = 255

export const Composer = forwardRef(function Composer(
  {
    replyTo,
  }: {
    replyTo: string | undefined
  },
  ref,
) {
  const store = useStores()
  const [text, setText] = useState('')

  const onChangeText = (newText: string) => {
    if (newText.length > MAX_TEXT_LENGTH) {
      setText(newText.slice(0, MAX_TEXT_LENGTH))
    } else {
      setText(newText)
    }
  }

  useImperativeHandle(ref, () => ({
    async publish() {
      if (text.trim().length === 0) {
        return false
      }
      await apilib.post(store.api, 'alice.com', text, replyTo)
      Toast.show(`Your ${replyTo ? 'reply' : 'post'} has been created`, {
        duration: Toast.durations.LONG,
        position: Toast.positions.TOP,
        shadow: true,
        animation: true,
        hideOnPress: true,
      })
      return true
    },
  }))

  const progressColor =
    text.length > DANGER_TEXT_LENGTH
      ? '#e60000'
      : text.length > WARNING_TEXT_LENGTH
      ? '#f7c600'
      : undefined

  return (
    <KeyboardAvoidingView style={styles.outer} behavior="padding">
      <TextInput
        multiline
        scrollEnabled
        onChangeText={text => onChangeText(text)}
        value={text}
        placeholder={replyTo ? 'Write your reply' : "What's new in the scene?"}
        style={styles.textInput}
      />
      <View style={[s.flexRow, s.pt10, s.pb10, s.pr5]}>
        <View style={s.flex1} />
        <View>
          <ProgressCircle
            color={progressColor}
            progress={text.length / MAX_TEXT_LENGTH}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
})

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 10,
    height: '100%',
  },
  textInput: {
    flex: 1,
    padding: 10,
  },
})
