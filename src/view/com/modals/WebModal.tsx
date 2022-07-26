/**
 * Use this for the Web build only.
 * It's intended to replace the BottomSheet.
 *
 * Note: the dataSet properties are used to leverage custom CSS in public/index.html
 */
import React from 'react'
// @ts-ignore no declarations available -prf
import {TouchableWithoutFeedback, View} from 'react-native-web'

type Props = {onClose: () => void}
export const Modal: React.FC<Props> = ({onClose, children}) => {
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View dataSet={{'modal-overlay': 1}}>
        <View dataSet={{'modal-container': 1}}>{children}</View>
      </View>
    </TouchableWithoutFeedback>
  )
}
