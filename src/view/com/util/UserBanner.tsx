import React, {useCallback} from 'react'
import {StyleSheet, View, TouchableOpacity, Alert, Image} from 'react-native'
import Svg, {Rect, Defs, LinearGradient, Stop} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors, gradients} from '../../lib/styles'
import {
  openCamera,
  openCropper,
  openPicker,
  PickedMedia,
} from './images/image-crop-picker/ImageCropPicker'
import {useStores} from '../../../state'

export function UserBanner({
  banner,
  onSelectNewBanner,
}: {
  banner?: string | null
  onSelectNewBanner?: (img: PickedMedia) => void
}) {
  const store = useStores()
  const handleEditBanner = useCallback(() => {
    Alert.alert('Select upload method', '', [
      {
        text: 'Take a new photo',
        onPress: () => {
          openCamera(store, {
            mediaType: 'photo',
            // compressImageMaxWidth: 3000, TODO needed?
            width: 3000,
            // compressImageMaxHeight: 1000, TODO needed?
            height: 1000,
          }).then(onSelectNewBanner)
        },
      },
      {
        text: 'Select from gallery',
        onPress: () => {
          openPicker(store, {
            mediaType: 'photo',
          }).then(async items => {
            await openCropper(store, {
              mediaType: 'photo',
              path: items[0].path,
              // compressImageMaxWidth: 3000, TODO needed?
              width: 3000,
              // compressImageMaxHeight: 1000, TODO needed?
              height: 1000,
            }).then(onSelectNewBanner)
          })
        },
      },
    ])
  }, [store, onSelectNewBanner])

  const renderSvg = () => (
    <Svg width="100%" height="150" viewBox="50 0 200 100">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop
            offset="0"
            stopColor={gradients.blueDark.start}
            stopOpacity="1"
          />
          <Stop offset="1" stopColor={gradients.blueDark.end} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="400" height="100" fill="url(#grad)" />
      <Rect x="0" y="0" width="400" height="100" fill="url(#grad2)" />
    </Svg>
  )

  // setUserBanner is only passed as prop on the EditProfile component
  return onSelectNewBanner ? (
    <TouchableOpacity onPress={handleEditBanner}>
      {banner ? (
        <Image style={styles.bannerImage} source={{uri: banner}} />
      ) : (
        renderSvg()
      )}
      <View style={styles.editButtonContainer}>
        <FontAwesomeIcon
          icon="camera"
          size={12}
          style={{color: colors.white}}
        />
      </View>
    </TouchableOpacity>
  ) : banner ? (
    <Image
      style={styles.bannerImage}
      resizeMode="cover"
      source={{uri: banner}}
    />
  ) : (
    renderSvg()
  )
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    bottom: 8,
    right: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray5,
  },
  bannerImage: {
    width: '100%',
    height: 150,
  },
})
