import React from 'react'
import {ImageViewerContext} from 'view/com/imageviewer/ImageViewerContext'
import {Modal, StyleSheet, View} from 'react-native'
import {IImageViewerAction, IImageViewerState} from 'view/com/imageviewer/types'
import {ImageViewer} from 'view/com/imageviewer/ImageViewer'

interface IProps {
  children: React.ReactNode
}

const reducer = (state: IImageViewerState, action: IImageViewerAction) => {
  switch (action.type) {
    case 'setImages':
      return {...state, images: action.payload}
    case 'setIndex':
      return {...state, index: action.payload}
    case 'setVisible':
      return {...state, isVisible: action.payload}
    case 'setMeasurement':
      return {...state, measurements: action.payload}
    case 'setState':
      return {...state, ...action.payload}
    default:
      return state
  }
}

export function ImageViewerProvider({children}: IProps) {
  const [state, dispatch] = React.useReducer(reducer, {
    images: [],
    index: 0,
    isVisible: false,
    measurement: undefined,
  })

  return (
    <ImageViewerContext.Provider value={{state, dispatch}}>
      <View style={styles.container}>
        <Modal visible={state.isVisible} transparent hardwareAccelerated>
          <ImageViewer />
        </Modal>
      </View>

      {children}
    </ImageViewerContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    zIndex: -1,
  },
})
