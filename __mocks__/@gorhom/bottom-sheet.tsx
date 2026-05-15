import React, {type ReactNode} from 'react'
import {FlatList, Modal, ScrollView, TextInput, View} from 'react-native'
import {vi} from 'vitest'

const BottomSheetModalContext = React.createContext(null)
BottomSheetModalContext.displayName = 'BottomSheetModalContext'

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

const useBottomSheet = vi.fn()
const useBottomSheetModal = vi.fn()
const useBottomSheetSpringConfigs = vi.fn()
const useBottomSheetTimingConfigs = vi.fn()
const useBottomSheetInternal = vi.fn()
const useBottomSheetDynamicSnapPoints = vi.fn()

export {useBottomSheet}
export {useBottomSheetModal}
export {useBottomSheetSpringConfigs}
export {useBottomSheetTimingConfigs}
export {useBottomSheetInternal}
export {useBottomSheetDynamicSnapPoints}

export {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetHandle,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetTextInput,
}

export default BottomSheet
