import React from 'react'
import {StyleSheet, View} from 'react-native'
import Svg, {Circle, Text, Defs, LinearGradient, Stop} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {HighPriorityImage} from 'view/com/util/images/Image'
import {
  openCamera,
  openCropper,
  openPicker,
  PickedMedia,
} from './images/image-crop-picker/ImageCropPicker'
import {
  requestPhotoAccessIfNeeded,
  requestCameraAccessIfNeeded,
} from 'lib/permissions'
import {useStores} from 'state/index'
import {colors, gradients} from 'lib/styles'
import {DropdownButton} from './forms/DropdownButton'
import {usePalette} from 'lib/hooks/usePalette'

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
  onSelectNewAvatar?: (img: PickedMedia) => void
}) {
  const store = useStores()
  const pal = usePalette('default')
  const initials = getInitials(displayName || handle)

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
      icon: 'camera' as IconProp,
      onPress: async () => {
        if (!(await requestCameraAccessIfNeeded())) {
          return
        }
        onSelectNewAvatar?.(
          await openCamera(store, {
            mediaType: 'photo',
            width: 1000,
            height: 1000,
            cropperCircleOverlay: true,
          }),
        )
      },
    },
    {
      label: 'Library',
      icon: 'image' as IconProp,
      onPress: async () => {
        if (!(await requestPhotoAccessIfNeeded())) {
          return
        }
        const items = await openPicker(store, {
          mediaType: 'photo',
        })
        onSelectNewAvatar?.(
          await openCropper(store, {
            mediaType: 'photo',
            path: items[0].path,
            width: 1000,
            height: 1000,
            cropperCircleOverlay: true,
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
        <HighPriorityImage
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
      <View style={[styles.editButtonContainer, pal.btn]}>
        <FontAwesomeIcon
          icon="camera"
          size={12}
          color={pal.text.color as string}
        />
      </View>
    </DropdownButton>
  ) : avatar ? (
    <HighPriorityImage
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
