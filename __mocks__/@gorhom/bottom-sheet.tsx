import React, {ReactNode} from 'react'
import {View, ScrollView, Modal, FlatList, TextInput} from 'react-native'

const BottomSheetModalContext = React.createContext(null)

const BottomSheetModalProvider = (props: any) => {
  return <BottomSheetModalContext.Provider {...props} value={{}} />
}
class BottomSheet extends React.Component<{
  onClose?: () => void
  children?: ReactNode
}> {
  snapToIndex() {}
  snapToPosition() {}
  expand() {}
  collapse() {}
  close() {
    this.props.onClose?.()
  }
  forceClose() {}

  render() {
    return <View>{this.props.children}</View>
  }
}
const BottomSheetModal = (props: any) => <Modal {...props} />

const BottomSheetBackdrop = (props: any) => <View {...props} />
const BottomSheetHandle = (props: any) => <View {...props} />
const BottomSheetFooter = (props: any) => <View {...props} />
const BottomSheetScrollView = (props: any) => <ScrollView {...props} />
const BottomSheetFlatList = (props: any) => <FlatList {...props} />
const BottomSheetTextInput = (props: any) => <TextInput {...props} />

const useBottomSheet = jest.fn()
const useBottomSheetModal = jest.fn()
const useBottomSheetSpringConfigs = jest.fn()
const useBottomSheetTimingConfigs = jest.fn()
const useBottomSheetInternal = jest.fn()
const useBottomSheetDynamicSnapPoints = jest.fn()

export {useBottomSheet}
export {useBottomSheetModal}
export {useBottomSheetSpringConfigs}
export {useBottomSheetTimingConfigs}
export {useBottomSheetInternal}
export {useBottomSheetDynamicSnapPoints}

export {
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetHandle,
  BottomSheetModal,
  BottomSheetFooter,
  BottomSheetScrollView,
  BottomSheetFlatList,
  BottomSheetTextInput,
}

export default BottomSheet
