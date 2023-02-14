import React from 'react'
import {StyleSheet, View} from 'react-native'
import Svg, {Circle, Text, Defs, LinearGradient, Stop} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import FastImage from 'react-native-fast-image'
import {openCropper, Image as PickedImage} from 'react-native-image-crop-picker'
import * as ImagePicker from 'expo-image-picker'

import {colors, gradients} from '../../lib/styles'
import {DropdownButton} from './forms/DropdownButton'
import {usePalette} from '../../lib/hooks/usePalette'
import {
  useCameraPermission,
  usePhotoLibraryPermission,
} from '../../../lib/usePermissions'

export function UserAvatar({
  size,
  handle,
  avatar,
  displayName,
  onSelectNewAvatar,
}: {
  size: number
  handle: string
  displayName: string | undefined
  avatar?: string | null
  onSelectNewAvatar?: (img: PickedImage) => void
}) {
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const initials = getInitials(displayName || handle || '')
  const pal = usePalette('default')
  const renderSvg = (svgSize: number, svgInitials: string) => (
    <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={gradients.blue.start} stopOpacity="1" />
          <Stop offset="1" stopColor={gradients.blue.end} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#grad)" />
      <Text
        fill="white"
        fontSize="50"
        fontWeight="bold"
        x="50"
        y="67"
        textAnchor="middle">
        {svgInitials}
      </Text>
    </Svg>
  )

  const dropdownItems = [
    {
      label: 'Camera',
      icon: 'camera',
      onPress: async () => {
        if (!(await requestCameraAccessIfNeeded())) {
          return
        }
        const cameraRes = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        })
        const item = cameraRes.assets[0]
        const cropperRes = await openCropper({
          mediaType: 'photo',
          path: item.uri,
          cropping: true,
          width: 2000,
          height: 2000,
          cropperCircleOverlay: true,
          forceJpg: true, // ios only
          compressImageQuality: 1,
        })

        onSelectNewAvatar?.(cropperRes)
      },
    },
    {
      label: 'Library',
      icon: 'image',
      onPress: async () => {
        if (!(await requestPhotoAccessIfNeeded())) {
          return
        }
        const pickedImage = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: false,
          quality: 1,
        })

        const item = pickedImage.assets[0]
        onSelectNewAvatar?.(
          await openCropper({
            mediaType: 'photo',
            path: item.uri,
            width: 2000,
            height: 2000,
            cropperCircleOverlay: true,
            forceJpg: true, // ios only
            compressImageQuality: 1,
          }),
        )
      },
    },
    // TODO: Remove avatar https://github.com/bluesky-social/social-app/issues/122
    // {
    //   label: 'Remove',
    //   icon: ['far', 'trash-can'],
    //   onPress: () => {
    //   // Remove avatar API call
    //   },
    // },
  ]
  // onSelectNewAvatar is only passed as prop on the EditProfile component
  return onSelectNewAvatar ? (
    <DropdownButton
      type="bare"
      items={dropdownItems}
      openToRight
      rightOffset={-10}
      bottomOffset={-10}
      menuWidth={170}>
      {avatar ? (
        <FastImage
          style={{
            width: size,
            height: size,
            borderRadius: Math.floor(size / 2),
          }}
          source={{
            uri: avatar,
            priority: FastImage.priority.high,
          }}
        />
      ) : (
        renderSvg(size, initials)
      )}
      <View style={[styles.editButtonContainer, pal.btn]}>
        <FontAwesomeIcon
          icon="camera"
          size={12}
          color={pal.text.color as string}
        />
      </View>
    </DropdownButton>
  ) : avatar ? (
    <FastImage
      style={{width: size, height: size, borderRadius: Math.floor(size / 2)}}
      resizeMode="stretch"
      source={{uri: avatar, priority: FastImage.priority.high}}
    />
  ) : (
    renderSvg(size, initials)
  )
}

function getInitials(str: string): string {
  const tokens = str
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .split(' ')
    .filter(Boolean)
    .map(v => v.trim())
  if (tokens.length >= 2 && tokens[0][0] && tokens[0][1]) {
    return tokens[0][0].toUpperCase() + tokens[1][0].toUpperCase()
  }
  if (tokens.length === 1 && tokens[0][0]) {
    return tokens[0][0].toUpperCase()
  }
  return 'X'
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    bottom: 0,
    right: 0,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray5,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
})
