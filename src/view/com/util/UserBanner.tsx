import React, {useCallback} from 'react'
import {StyleSheet, View, TouchableOpacity, Alert, Image} from 'react-native'
import Svg, {Rect, Defs, LinearGradient, Stop} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Image as PickedImage} from 'react-native-image-crop-picker'
import {getGradient} from '../../lib/asset-gen'
import {colors} from '../../lib/styles'
import {
  openCamera,
  openCropper,
  openPicker,
} from 'react-native-image-crop-picker'

export function UserBanner({
  handle,
  banner,
  onSelectNewBanner,
}: {
  handle: string
  banner?: string | null
  onSelectNewBanner?: (img: PickedImage) => void
}) {
  const gradient = getGradient(handle)

  const handleEditBanner = useCallback(() => {
    Alert.alert('Select upload method', '', [
      {
        text: 'Take a new photo',
        onPress: () => {
          openCamera({
            mediaType: 'photo',
            cropping: true,
            compressImageMaxWidth: 1500,
            width: 1500,
            compressImageMaxHeight: 500,
            height: 500,
            forceJpg: true, // ios only
            compressImageQuality: 1,
            includeExif: true,
          }).then(onSelectNewBanner)
        },
      },
      {
        text: 'Select from gallery',
        onPress: () => {
          openPicker({
            mediaType: 'photo',
          }).then(async item => {
            await openCropper({
              mediaType: 'photo',
              path: item.path,
              compressImageMaxWidth: 1500,
              width: 1500,
              compressImageMaxHeight: 500,
              height: 500,
              forceJpg: true, // ios only
              compressImageQuality: 1,
              includeExif: true,
            }).then(onSelectNewBanner)
          })
        },
      },
    ])
  }, [onSelectNewBanner])

  const renderSvg = () => (
    <Svg width="100%" height="120" viewBox="50 0 200 100">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={gradient[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={gradient[1]} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fff" stopOpacity="0" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0.3" />
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
    height: 120,
  },
})
