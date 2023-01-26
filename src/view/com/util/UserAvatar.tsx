import React, {useCallback} from 'react'
import {Alert, Image, StyleSheet, TouchableOpacity, View} from 'react-native'
import Svg, {Circle, Text, Defs, LinearGradient, Stop} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {
  openCamera,
  openCropper,
  openPicker,
  Image as PickedImage,
} from './images/ImageCropPicker'
import {colors, gradients} from '../../lib/styles'

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
  const initials = getInitials(displayName || handle)

  const handleEditAvatar = useCallback(() => {
    Alert.alert('Select upload method', '', [
      {
        text: 'Take a new photo',
        onPress: () => {
          openCamera({
            mediaType: 'photo',
            cropping: true,
            width: 1000,
            height: 1000,
            cropperCircleOverlay: true,
            forceJpg: true, // ios only
            compressImageQuality: 1,
          }).then(onSelectNewAvatar)
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
              width: 1000,
              height: 1000,
              cropperCircleOverlay: true,
              forceJpg: true, // ios only
              compressImageQuality: 1,
            }).then(onSelectNewAvatar)
          })
        },
      },
    ])
  }, [onSelectNewAvatar])

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

  // onSelectNewAvatar is only passed as prop on the EditProfile component
  return onSelectNewAvatar ? (
    <TouchableOpacity onPress={handleEditAvatar}>
      {avatar ? (
        <Image
          style={{
            width: size,
            height: size,
            borderRadius: Math.floor(size / 2),
          }}
          source={{uri: avatar}}
        />
      ) : (
        renderSvg(size, initials)
      )}
      <View style={styles.editButtonContainer}>
        <FontAwesomeIcon
          icon="camera"
          size={12}
          style={{color: colors.white}}
        />
      </View>
    </TouchableOpacity>
  ) : avatar ? (
    <Image
      style={{width: size, height: size, borderRadius: Math.floor(size / 2)}}
      resizeMode="stretch"
      source={{uri: avatar}}
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
