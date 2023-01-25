import * as Toast from '../Toast'
import RNFetchBlob from 'rn-fetch-blob'
import {Share} from 'react-native'
import RNFS from 'react-native-fs'

export const saveImageModal = async ({uri}: {uri: string}) => {
  RNFetchBlob.config({
    fileCache: true,
  })
    .fetch('GET', uri)
    .then(resp => {
      // the image path you can use it directly with Image component
      imagePath = resp.path()

      return resp.readFile('base64')
    })
    .then(async base64Data => {
      // here's base64 encoded image
      console.log(base64Data)
      // remove the file from storage

      try {
        const result = await Share.share({
          message: 'Share Photo',
          url: 'data:image/png;base64,' + base64Data,
        })
        if (result.action === Share.sharedAction) {
          Toast.show('Image saved to gallery')

          if (result.activityType) {
            // shared with activity type of result.activityType
          } else {
            // shared
          }
        } else if (result.action === Share.dismissedAction) {
          // dismissed
        }
        RNFS.un
      } catch (error: any) {
        console.log(error.message)
      }
    })
}
