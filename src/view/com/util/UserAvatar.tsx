import React, {useMemo} from 'react'
import {StyleSheet, View} from 'react-native'
import Svg, {Circle, Rect, Path} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {HighPriorityImage} from 'view/com/util/images/Image'
import {openCamera, openCropper, openPicker} from '../../../lib/media/picker'
import {
  usePhotoLibraryPermission,
  useCameraPermission,
} from 'lib/hooks/usePermissions'
import {useStores} from 'state/index'
import {colors} from 'lib/styles'
import {DropdownButton} from './forms/DropdownButton'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb, isAndroid} from 'platform/detection'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {AvatarModeration} from 'lib/labeling/types'

type Type = 'user' | 'algo'

const BLUR_AMOUNT = isWeb ? 5 : 100

function DefaultAvatar({type, size}: {type: Type; size: number}) {
  if (type === 'algo') {
    // Font Awesome Pro 6.4.0 by @fontawesome -https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc.
    return (
      <Svg
        testID="userAvatarFallback"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        stroke="none">
        <Rect width="32" height="32" rx="4" fill="#0070FF" />
        <Path
          d="M13.5 7.25C13.5 6.55859 14.0586 6 14.75 6C20.9648 6 26 11.0352 26 17.25C26 17.9414 25.4414 18.5 24.75 18.5C24.0586 18.5 23.5 17.9414 23.5 17.25C23.5 12.418 19.582 8.5 14.75 8.5C14.0586 8.5 13.5 7.94141 13.5 7.25ZM8.36719 14.6172L12.4336 18.6836L13.543 17.5742C13.5156 17.4727 13.5 17.3633 13.5 17.25C13.5 16.5586 14.0586 16 14.75 16C15.4414 16 16 16.5586 16 17.25C16 17.9414 15.4414 18.5 14.75 18.5C14.6367 18.5 14.5312 18.4844 14.4258 18.457L13.3164 19.5664L17.3828 23.6328C17.9492 24.1992 17.8438 25.1484 17.0977 25.4414C16.1758 25.8008 15.1758 26 14.125 26C9.63672 26 6 22.3633 6 17.875C6 16.8242 6.19922 15.8242 6.5625 14.9023C6.85547 14.1602 7.80469 14.0508 8.37109 14.6172H8.36719ZM14.75 9.75C18.8906 9.75 22.25 13.1094 22.25 17.25C22.25 17.9414 21.6914 18.5 21 18.5C20.3086 18.5 19.75 17.9414 19.75 17.25C19.75 14.4883 17.5117 12.25 14.75 12.25C14.0586 12.25 13.5 11.6914 13.5 11C13.5 10.3086 14.0586 9.75 14.75 9.75Z"
          fill="white"
        />
      </Svg>
    )
  }
  return (
    <Svg
      testID="userAvatarFallback"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="none">
      <Circle cx="12" cy="12" r="12" fill="#0070ff" />
      <Circle cx="12" cy="9.5" r="3.5" fill="#fff" />
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#fff"
        d="M 12.058 22.784 C 9.422 22.784 7.007 21.836 5.137 20.262 C 5.667 17.988 8.534 16.25 11.99 16.25 C 15.494 16.25 18.391 18.036 18.864 20.357 C 17.01 21.874 14.64 22.784 12.058 22.784 Z"
      />
    </Svg>
  )
}

export function UserAvatar({
  type = 'user',
  size,
  avatar,
  moderation,
  onSelectNewAvatar,
}: {
  type?: Type
  size: number
  avatar?: string | null
  moderation?: AvatarModeration
  onSelectNewAvatar?: (img: RNImage | null) => void
}) {
  const store = useStores()
  const pal = usePalette('default')
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()

  const aviStyle = useMemo(() => {
    if (type === 'algo') {
      return {
        width: size,
        height: size,
        borderRadius: 8,
      }
    }
    return {
      width: size,
      height: size,
      borderRadius: Math.floor(size / 2),
    }
  }, [type, size])

  const dropdownItems = useMemo(
    () => [
      !isWeb && {
        testID: 'changeAvatarCameraBtn',
        label: 'Camera',
        icon: 'camera' as IconProp,
        onPress: async () => {
          if (!(await requestCameraAccessIfNeeded())) {
            return
          }

          onSelectNewAvatar?.(
            await openCamera(store, {
              width: 1000,
              height: 1000,
              cropperCircleOverlay: true,
            }),
          )
        },
      },
      {
        testID: 'changeAvatarLibraryBtn',
        label: 'Library',
        icon: 'image' as IconProp,
        onPress: async () => {
          if (!(await requestPhotoAccessIfNeeded())) {
            return
          }

          const items = await openPicker(store, {
            aspect: [1, 1],
          })
          const item = items[0]

          const croppedImage = await openCropper(store, {
            mediaType: 'photo',
            cropperCircleOverlay: true,
            height: item.height,
            width: item.width,
            path: item.path,
          })

          onSelectNewAvatar?.(croppedImage)
        },
      },
      {
        testID: 'changeAvatarRemoveBtn',
        label: 'Remove',
        icon: ['far', 'trash-can'] as IconProp,
        onPress: async () => {
          onSelectNewAvatar?.(null)
        },
      },
    ],
    [
      onSelectNewAvatar,
      requestCameraAccessIfNeeded,
      requestPhotoAccessIfNeeded,
      store,
    ],
  )

  const warning = useMemo(() => {
    if (!moderation?.warn) {
      return null
    }
    return (
      <View style={[styles.warningIconContainer, pal.view]}>
        <FontAwesomeIcon
          icon="exclamation-circle"
          style={styles.warningIcon}
          size={Math.floor(size / 3)}
        />
      </View>
    )
  }, [moderation?.warn, size, pal])

  // onSelectNewAvatar is only passed as prop on the EditProfile component
  return onSelectNewAvatar ? (
    <DropdownButton
      testID="changeAvatarBtn"
      type="bare"
      items={dropdownItems}
      openToRight
      rightOffset={-10}
      bottomOffset={-10}
      menuWidth={170}>
      {avatar ? (
        <HighPriorityImage
          testID="userAvatarImage"
          style={aviStyle}
          source={{uri: avatar}}
          accessibilityRole="image"
        />
      ) : (
        <DefaultAvatar type={type} size={size} />
      )}
      <View style={[styles.editButtonContainer, pal.btn]}>
        <FontAwesomeIcon
          icon="camera"
          size={12}
          color={pal.text.color as string}
        />
      </View>
    </DropdownButton>
  ) : avatar &&
    !((moderation?.blur && isAndroid) /* android crashes with blur */) ? (
    <View style={{width: size, height: size}}>
      <HighPriorityImage
        testID="userAvatarImage"
        style={aviStyle}
        contentFit="cover"
        source={{uri: avatar}}
        blurRadius={moderation?.blur ? BLUR_AMOUNT : 0}
      />
      {warning}
    </View>
  ) : (
    <View style={{width: size, height: size}}>
      <DefaultAvatar type={type} size={size} />
      {warning}
    </View>
  )
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
  warningIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 100,
  },
  warningIcon: {
    color: colors.red3,
  },
})
