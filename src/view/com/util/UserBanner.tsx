import React from 'react'
import {StyleSheet, View} from 'react-native'
import Svg, {Rect, Defs, LinearGradient, Stop} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Image as PickedImage} from 'react-native-image-crop-picker'
import FastImage from 'react-native-fast-image'
import {colors, gradients} from '../../lib/styles'
import {
  openCamera,
  openCropper,
  openPicker,
} from 'react-native-image-crop-picker'
import {DropdownButton} from './forms/DropdownButton'

export function UserBanner({
  banner,
  onSelectNewBanner,
}: {
  banner?: string | null
  onSelectNewBanner?: (img: PickedImage) => void
}) {
  const dropdownItems = [
    {
      label: 'Camera',
      icon: 'camera',
      // TODO: Add darkmode support https://github.com/bluesky-social/social-app/issues/78
      onPress: () => {
        openCamera({
          mediaType: 'photo',
          cropping: true,
          compressImageMaxWidth: 6000,
          width: 6000,
          compressImageMaxHeight: 2000,
          height: 2000,
          forceJpg: true, // ios only
          compressImageQuality: 1,
          includeExif: true,
        }).then(onSelectNewBanner)
      },
    },
    {
      label: 'Library',
      icon: 'image',
      onPress: () => {
        openPicker({
          mediaType: 'photo',
        }).then(async item => {
          await openCropper({
            mediaType: 'photo',
            path: item.path,
            compressImageMaxWidth: 6000,
            width: 6000,
            compressImageMaxHeight: 2000,
            height: 2000,
            forceJpg: true, // ios only
            compressImageQuality: 1,
            includeExif: true,
          }).then(onSelectNewBanner)
        })
      },
    },
    // TODO: Remove banner https://github.com/bluesky-social/social-app/issues/122
    // {
    //   label: 'Remove',
    //   icon: ['far', 'trash-can'],
    //   onPress: () => {
    //     // Remove banner api call
    //   },
    // },
  ]

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
    <DropdownButton
      type="bare"
      items={dropdownItems}
      openToRight
      rightOffset={-200}
      bottomOffset={-10}
      menuWidth={170}>
      {banner ? (
        <FastImage style={styles.bannerImage} source={{uri: banner}} />
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
    </DropdownButton>
  ) : banner ? (
    <FastImage
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
