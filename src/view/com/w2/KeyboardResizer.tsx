import React, {ReactNode, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {Animated, Keyboard, KeyboardEvent, StyleSheet} from 'react-native'

// const {State: TextInputState} = TextInput

interface Props {
  shift: Animated.Value
  onKeyboardWillShow?: (event: KeyboardEvent) => void
  onKeyboardDidShow?: (event: KeyboardEvent) => void
  onKeyboardWillHide?: (event: KeyboardEvent) => void
  onKeyboardDidHide?: (event: KeyboardEvent) => void
  onKeyboardWillChangeFrame?: (event: KeyboardEvent) => void
  onKeyboardDidChangeFrame?: (event: KeyboardEvent) => void
  children?: ReactNode
}

// WillChangeFrame
// WillShow
// DidChangeFrame
// DidShow

// WillChangeFrame
// WillHide
// DidChangeFrame
// DidHide
export const KeyboardResizer = observer(function KeybordResizer({
  shift,
  onKeyboardWillShow,
  onKeyboardDidShow,
  onKeyboardWillHide,
  onKeyboardDidHide,
  onKeyboardWillChangeFrame,
  onKeyboardDidChangeFrame,
  children,
}: Props) {
  useEffect(() => {
    const keyboardWillShowSub = onKeyboardWillShow
      ? Keyboard.addListener('keyboardWillShow', onKeyboardWillShow)
      : undefined

    const keyboardDidShowSub = onKeyboardDidShow
      ? Keyboard.addListener('keyboardDidShow', onKeyboardDidShow)
      : undefined

    const keyboardWillHideSub = onKeyboardWillHide
      ? Keyboard.addListener('keyboardWillHide', onKeyboardWillHide)
      : undefined

    const keyboardDidHideSub = onKeyboardDidHide
      ? Keyboard.addListener('keyboardDidHide', onKeyboardDidHide)
      : undefined

    const keyboardWillChangeFrameSub = onKeyboardWillChangeFrame
      ? Keyboard.addListener(
          'keyboardWillChangeFrame',
          onKeyboardWillChangeFrame,
        )
      : undefined

    const keyboardDidChangeFrameSub = onKeyboardDidChangeFrame
      ? Keyboard.addListener('keyboardDidChangeFrame', onKeyboardDidChangeFrame)
      : undefined

    const cleanup = () => {
      keyboardWillShowSub?.remove()
      keyboardDidShowSub?.remove()
      keyboardWillHideSub?.remove()
      keyboardDidHideSub?.remove()
      keyboardWillChangeFrameSub?.remove()
      keyboardDidChangeFrameSub?.remove()
    }
    return cleanup
  }, [
    onKeyboardDidChangeFrame,
    onKeyboardDidHide,
    onKeyboardDidShow,
    onKeyboardWillChangeFrame,
    onKeyboardWillHide,
    onKeyboardWillShow,
  ])

  return (
    <Animated.View
      style={[styles.container, {transform: [{translateY: shift}]}]}>
      {children}
    </Animated.View>
  )
})

/*
export class KeyboardResizerOld extends React.Component<{
  children?: ReactNode
}> {
  state = {
    shift: new Animated.Value(0),
  }

  // constructor(public rootStore: RootStoreModel) {
  //   makeAutoObservable(
  //     this,
  //     {
  //       rootStore: false,
  //     },
  //     {autoBind: true},
  //   )
  // }

  render() {
    const {shift} = this.state
    return (
      <Animated.View
        style={[styles.container, {transform: [{translateY: shift}]}]}>
        {this.props.children}
      </Animated.View>
    )
  }
  handleKeyboardWillShow = (e) => {
    console.log('KeyboardResizer::handleKeyboardWillShow')
  }
  handleKeyboardDidShow = () => {
    console.log('KeyboardResizer::handleKeyboardDidShow')
  }
  handleKeyboardWillHide = () => {
    console.log('KeyboardResizer::handleKeyboardWillHide')
  }
  handleKeyboardDidHide = () => {
    console.log('KeyboardResizer::handleKeyboardDidHide')
  }
  handleKeyboardWillChangeFrame = (event:) => {
    console.log('KeyboardResizer::handleKeyboardWillChangeFrame')
    event.
  }
  handleKeyboardDidChangeFrame = () => {
    console.log('KeyboardResizer::handleKeyboardDidChangeFrame')
  }
  /*
  handleKeyboardDidShow = event => {
    const {height: windowHeight} = Dimensions.get('window')
    const keyboardHeight = event.endCoordinates.height
    const currentlyFocusedField = TextInputState.currentlyFocusedField()
    UIManager.measure(
      currentlyFocusedField,
      (originX, originY, width, height, pageX, pageY) => {
        const fieldHeight = height
        const fieldTop = pageY
        const gap = windowHeight - keyboardHeight - (fieldTop + fieldHeight)
        if (gap >= 0) {
          return
        }
        Animated.timing(this.state.shift, {
          toValue: gap,
          duration: 1000,
          useNativeDriver: true,
        }).start()
      },
    )
  }

  handleKeyboardDidHide = () => {
    Animated.timing(this.state.shift, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start()
  }

}
*/

const styles = StyleSheet.create({
  container: {
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
})
