import React, {useCallback, useState} from 'react'
import {StyleSheet, View, TouchableOpacity, Alert, Image} from 'react-native'
import Svg, {Rect, Defs, LinearGradient, Stop} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {getGradient} from '../../lib/asset-gen'
import {colors} from '../../lib/styles'
import {
  openCamera,
  openCropper,
  openPicker,
} from 'react-native-image-crop-picker'

export function UserBanner({
  handle,
  isEditable = false,
}: {
  handle: string
  isEditable?: boolean
}) {
  const gradient = getGradient(handle)

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const handleEditBanner = useCallback(() => {
    Alert.alert('Select upload method', '', [
      {
        text: 'Take a new photo',
        onPress: () => {
          openCamera({
            mediaType: 'photo',
            cropping: true,
            width: 1500,
            height: 500,
          }).then(item => {
            setUploadedImage(item.path)
            console.log(item)
          })
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
              width: 1500,
              height: 500,
            }).then(croppedItem => {
              setUploadedImage(croppedItem.path)
              console.log(croppedItem)
            })
          })
        },
      },
    ])
  }, [])

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

  return isEditable ? (
    <TouchableOpacity onPress={handleEditBanner}>
      {/* Added a react state temporary photo white the protocol does not support imagery */}
      {uploadedImage != null ? (
        <Image
          style={styles.bannerImage}
          resizeMode="stretch"
          source={{uri: uploadedImage}}
        />
      ) : (
        renderSvg()
      )}
      <View style={styles.editButtonContainer}>
        <FontAwesomeIcon
          icon="camera"
          size={24}
          style={{color: colors.gray1 + '99'}}
        />
      </View>
    </TouchableOpacity>
  ) : (
    renderSvg()
  )
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    width: 50,
    height: 50,
    top: '50%',
    left: '50%',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray5 + '99',
    transform: [{translateX: -25}, {translateY: -25}],
  },
  bannerImage: {
    width: '100%',
    height: 120,
  },
})
