import * as Toast from '../Toast'
import RNFetchBlob from 'rn-fetch-blob'
import {Share} from 'react-native'
import RNFS from 'react-native-fs'

export const saveImageModal = async ({uri}: {uri: string}) => {
  const downloadResponse = await RNFetchBlob.config({
    fileCache: true,
  }).fetch('GET', uri)

  const imagePath = downloadResponse.path()
  const base64Data = await downloadResponse.readFile('base64')
  const result = await Share.share({
    url: 'data:image/png;base64,' + base64Data,
  })
  if (result.action === Share.sharedAction) {
    Toast.show('Image saved to gallery')
  } else if (result.action === Share.dismissedAction) {
    // dismissed
  }
  RNFS.unlink(imagePath)
}
