import React, {
  forwardRef,
  useState,
  useMemo,
  useImperativeHandle,
  useRef,
} from 'react'
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import BottomSheet, {BottomSheetBackdropProps} from '@gorhom/bottom-sheet'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'
import Toast from '../util/Toast'
import Clipboard from '@react-native-clipboard/clipboard'
import {s} from '../../lib/styles'

export const ShareModal = forwardRef(function ShareModal({}: {}, ref) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uri, setUri] = useState<string>('')
  const bottomSheetRef = useRef<BottomSheet>(null)

  useImperativeHandle(ref, () => ({
    open(uri: string) {
      console.log('sharing', uri)
      setUri(uri)
      setIsOpen(true)
    },
  }))

  const onPressCopy = () => {
    Clipboard.setString(uri)
    console.log('showing')
    console.log(Toast)
    console.log(Toast.show)
    Toast.show('Link copied', {
      position: Toast.positions.TOP,
    })
  }
  const onShareBottomSheetChange = (snapPoint: number) => {
    if (snapPoint === -1) {
      console.log('unsharing')
      setIsOpen(false)
    }
  }
  const onClose = () => {
    bottomSheetRef.current?.close()
  }

  const CustomBackdrop = ({animatedIndex, style}: BottomSheetBackdropProps) => {
    // animated variables
    const opacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        animatedIndex.value, // current snap index
        [-1, 0], // input range
        [0, 0.5], // output range
        Extrapolate.CLAMP,
      ),
    }))

    const containerStyle = useMemo(
      () => [style, {backgroundColor: '#000'}, opacity],
      [style, opacity],
    )

    return (
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={containerStyle} />
      </TouchableWithoutFeedback>
    )
  }
  return (
    <>
      {isOpen && (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={['50%']}
          enablePanDownToClose
          backdropComponent={CustomBackdrop}
          onChange={onShareBottomSheetChange}>
          <View>
            <Text style={[s.textCenter, s.bold, s.mb10]}>Share this post</Text>
            <Text style={[s.textCenter, s.mb10]}>{uri}</Text>
            <Button title="Copy to clipboard" onPress={onPressCopy} />
            <View style={s.p10}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={s.textCenter}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      )}
    </>
  )
})

const styles = StyleSheet.create({
  closeBtn: {
    width: '100%',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
  },
})
