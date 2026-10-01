import {memo, useCallback, useMemo, useState} from 'react'
import {
  Image as RNImage,
  type ImageStyle,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text as RNText,
  View,
  type ViewStyle,
} from 'react-native'
import {Image as ExpoImage} from 'expo-image'
import {type ModerationUI} from '@bsky/sdk/moderation'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {IMAGE_SIZE_CONFIG_2K_1MB} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {
  useCameraPermission,
  usePhotoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {compressIfNeeded} from '#/lib/media/manip'
import {openCamera, openCropper, openPicker} from '#/lib/media/picker'
import {type PickerImage} from '#/lib/media/picker.shared'
import {convertCdnPreset} from '#/lib/media/util'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {isCancelledError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {
  type ComposerImage,
  compressImage,
  createComposerImage,
} from '#/state/gallery'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {EditImageDialog} from '#/view/com/composer/photos/EditImageDialog'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {
  Camera_Filled_Stroke2_Corner0_Rounded as CameraFilledIcon,
  Camera_Stroke2_Corner0_Rounded as CameraIcon,
} from '#/components/icons/Camera'
import {NanoGlyph} from '#/components/icons/nano'
import {StreamingLive_Stroke2_Corner0_Rounded as LibraryIcon} from '#/components/icons/StreamingLive'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Link} from '#/components/Link'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import * as Menu from '#/components/Menu'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {useAnalytics} from '#/analytics'
import {IS_ANDROID, IS_NATIVE, IS_WEB, IS_WEB_TOUCH_DEVICE} from '#/env'
import {useActorStatus} from '#/features/liveNow'
import {LiveIndicator} from '#/features/liveNow/components/LiveIndicator'
import {LiveStatusDialog} from '#/features/liveNow/components/LiveStatusDialog'
import type * as bsky from '#/types/bsky'

export type UserAvatarType = 'user' | 'algo' | 'list' | 'labeler'

interface BaseUserAvatarProps {
  type?: UserAvatarType
  shape?: 'circle' | 'square'
  size: number
  avatar?: string | null
  live?: boolean
  hideLiveBadge?: boolean
}

interface UserAvatarProps extends BaseUserAvatarProps {
  type: UserAvatarType
  moderation?: ModerationUI
  usePlainRNImage?: boolean
  noBorder?: boolean
  onLoad?: () => void
  style?: StyleProp<ViewStyle>
  extraAviStyle?: ImageStyle
}

interface EditableUserAvatarProps extends BaseUserAvatarProps {
  onSelectNewAvatar: (img: PickerImage | null) => void
}

interface PreviewableUserAvatarProps extends BaseUserAvatarProps {
  moderation?: ModerationUI
  profile: bsky.profile.AnyProfileView
  disableHoverCard?: boolean
  disableNavigation?: boolean
  disableLink?: boolean
  onBeforePress?: () => void
}

const BLUR_AMOUNT = IS_WEB ? 5 : 100

let DefaultAvatar = ({
  type,
  shape: overrideShape,
  size,
}: {
  type: UserAvatarType
  shape?: 'square' | 'circle'
  size: number
}): React.ReactNode => {
  const finalShape = overrideShape ?? (type === 'user' ? 'circle' : 'square')

  const aviStyle = useMemo(() => {
    if (finalShape === 'square') {
      return {borderRadius: size > 32 ? 8 : 3, overflow: 'hidden'} as const
    }
  }, [finalShape, size])

  /*
   * Each fallback is one multi-layer glyph: the coloured background is layer
   * 0, the white artwork layer 1.
   */
  if (type === 'algo') {
    // Font Awesome Pro 6.4.0 by @fontawesome -https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc.
    return (
      <NanoGlyph
        testID="userAvatarFallback"
        name="DefaultAvatarAlgo"
        size={size}
        color={['#0070FF', '#fff']}
        style={aviStyle}
      />
    )
  }
  if (type === 'list') {
    // Font Awesome Pro 6.4.0 by @fontawesome -https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc.
    return (
      <NanoGlyph
        testID="userAvatarFallback"
        name="DefaultAvatarList"
        size={size}
        color={['#0070FF', '#fff']}
        style={aviStyle}
      />
    )
  }
  if (type === 'labeler') {
    return (
      <NanoGlyph
        testID="userAvatarFallback"
        name={
          finalShape === 'square'
            ? 'DefaultAvatarLabelerSquare'
            : 'DefaultAvatarLabelerCircle'
        }
        size={size}
        color={[tokens.color.temp_purple, '#fff']}
        style={aviStyle}
      />
    )
  }
  return (
    <NanoGlyph
      testID="userAvatarFallback"
      name="DefaultAvatarUser"
      size={size}
      color={['#0070ff', '#fff']}
      style={aviStyle}
    />
  )
}
DefaultAvatar = memo(DefaultAvatar)
export {DefaultAvatar}

let UserAvatar = ({
  type = 'user',
  shape: overrideShape,
  size,
  avatar,
  moderation,
  usePlainRNImage = false,
  onLoad,
  style,
  live,
  hideLiveBadge,
  noBorder,
  extraAviStyle,
}: UserAvatarProps): React.ReactNode => {
  const t = useTheme()
  const finalShape = overrideShape ?? (type === 'user' ? 'circle' : 'square')

  const aviStyle = useMemo(() => {
    let borderRadius
    if (finalShape === 'square') {
      borderRadius = size > 32 ? 8 : 3
    } else {
      borderRadius = Math.floor(size / 2)
    }

    return {
      width: size,
      height: size,
      borderRadius,
      backgroundColor: t.palette.contrast_25,
      ...extraAviStyle,
    }
  }, [finalShape, size, t, extraAviStyle])

  const borderStyle = useMemo(() => {
    return [
      {borderRadius: aviStyle.borderRadius},
      live && {
        borderColor: t.palette.negative_500,
        borderWidth: size > 16 ? 2 : 1,
        opacity: 1,
      },
    ]
  }, [aviStyle.borderRadius, live, t, size])

  const alert = useMemo(() => {
    if (!moderation?.alert) {
      return null
    }
    return (
      <View
        style={[
          a.absolute,
          a.right_0,
          a.bottom_0,
          a.rounded_full,
          {width: 16, height: 16},
          a.align_center,
          a.justify_center,
          {backgroundColor: t.palette.pink},
          {transform: [{scale: size / 42}]},
        ]}>
        <RNText
          style={[
            a.text_sm,
            a.font_bold,
            a.text_center,
            {
              color: t.palette.white,
              includeFontPadding: false,
              textAlignVertical: 'center',
            },
          ]}
          minimumFontScale={1}
          maxFontSizeMultiplier={1}>
          !
        </RNText>
      </View>
    )
  }, [moderation?.alert, size, t])

  const containerStyle = useMemo(() => {
    return [
      {
        width: size,
        height: size,
      },
      style,
    ]
  }, [size, style])

  return avatar &&
    !(moderation?.blur && IS_ANDROID /* android crashes with blur */) ? (
    <View style={containerStyle}>
      {usePlainRNImage ? (
        <RNImage
          accessibilityIgnoresInvertColors
          testID="userAvatarImage"
          style={aviStyle}
          resizeMode="cover"
          source={{
            uri: hackModifyThumbnailPath(avatar, size < 90),
          }}
          blurRadius={moderation?.blur ? BLUR_AMOUNT : 0}
          onLoad={onLoad}
        />
      ) : (
        <ExpoImage
          testID="userAvatarImage"
          style={aviStyle}
          contentFit="cover"
          source={{
            uri: hackModifyThumbnailPath(avatar, size < 90),
          }}
          blurRadius={moderation?.blur ? BLUR_AMOUNT : 0}
          onLoad={onLoad}
          useAppleWebpCodec
        />
      )}
      {!noBorder && <MediaInsetBorder style={borderStyle} />}
      {live && size > 16 && !hideLiveBadge && (
        <LiveIndicator size={size > 32 ? 'small' : 'tiny'} />
      )}
      {alert}
    </View>
  ) : (
    <View style={containerStyle}>
      <DefaultAvatar type={type} shape={finalShape} size={size} />
      {!noBorder && <MediaInsetBorder style={borderStyle} />}
      {live && size > 16 && !hideLiveBadge && (
        <LiveIndicator size={size > 32 ? 'small' : 'tiny'} />
      )}
      {alert}
    </View>
  )
}
UserAvatar = memo(UserAvatar)
export {UserAvatar}

let EditableUserAvatar = ({
  type = 'user',
  size,
  avatar,
  onSelectNewAvatar,
}: EditableUserAvatarProps): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const [rawImage, setRawImage] = useState<ComposerImage | undefined>()
  const editImageDialogControl = useDialogControl()

  const sheetWrapper = useSheetWrapper()

  const circular = type !== 'algo' && type !== 'list'

  const aviStyle = useMemo(() => {
    if (!circular) {
      return {
        width: size,
        height: size,
        borderRadius: size > 32 ? 8 : 3,
      }
    }
    return {
      width: size,
      height: size,
      borderRadius: Math.floor(size / 2),
    }
  }, [circular, size])

  const onOpenCamera = useCallback(async () => {
    if (!(await requestCameraAccessIfNeeded())) {
      return
    }

    const image = await openCamera({
      aspect: [1, 1],
    })
    if (!image) {
      return
    }

    onSelectNewAvatar(await compressIfNeeded(image, IMAGE_SIZE_CONFIG_2K_1MB))
  }, [onSelectNewAvatar, requestCameraAccessIfNeeded])

  const onOpenLibrary = useCallback(async () => {
    if (!(await requestPhotoAccessIfNeeded())) {
      return
    }

    const items = await sheetWrapper(
      openPicker({
        aspect: [1, 1],
      }),
    )
    const item = items[0]
    if (!item) {
      return
    }

    try {
      if (IS_NATIVE) {
        onSelectNewAvatar(
          await compressIfNeeded(
            await openCropper({
              imageUri: item.path,
              shape: circular ? 'circle' : 'rectangle',
              aspectRatio: 1,
            }),
            IMAGE_SIZE_CONFIG_2K_1MB,
          ),
        )
      } else {
        setRawImage(await createComposerImage(item))
        editImageDialogControl.open()
      }
    } catch (e) {
      // Don't log errors for cancelling selection to sentry on ios or android
      if (!isCancelledError(e)) {
        logger.error('Failed to crop avatar', {error: e})
      }
    }
  }, [
    onSelectNewAvatar,
    requestPhotoAccessIfNeeded,
    sheetWrapper,
    editImageDialogControl,
    circular,
  ])

  const onRemoveAvatar = useCallback(() => {
    onSelectNewAvatar(null)
  }, [onSelectNewAvatar])

  const onChangeEditImage = useCallback(
    async (image: ComposerImage) => {
      const compressed = await compressImage(image, IMAGE_SIZE_CONFIG_2K_1MB)
      onSelectNewAvatar(compressed)
    },
    [onSelectNewAvatar],
  )

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Edit avatar`)}>
          {({props}) => (
            <Pressable {...props} testID="changeAvatarBtn">
              {avatar ? (
                <ExpoImage
                  testID="userAvatarImage"
                  style={aviStyle}
                  source={{uri: avatar}}
                  accessibilityRole="image"
                />
              ) : (
                <DefaultAvatar type={type} size={size} />
              )}
              <View
                style={[
                  styles.editButtonContainer,
                  t.atoms.bg_contrast_25,
                  a.border,
                  t.atoms.border_contrast_low,
                ]}>
                <CameraFilledIcon height={14} width={14} style={t.atoms.text} />
              </View>
            </Pressable>
          )}
        </Menu.Trigger>
        <Menu.Outer showCancel>
          <Menu.Group>
            {IS_NATIVE && (
              <Menu.Item
                testID="changeAvatarCameraBtn"
                label={_(msg`Upload from Camera`)}
                onPress={onOpenCamera}>
                <Menu.ItemText>
                  <Trans>Upload from Camera</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={CameraIcon} />
              </Menu.Item>
            )}

            <Menu.Item
              testID="changeAvatarLibraryBtn"
              label={_(msg`Upload from Library`)}
              onPress={onOpenLibrary}>
              <Menu.ItemText>
                {IS_NATIVE ? (
                  <Trans>Upload from Library</Trans>
                ) : (
                  <Trans>Upload from Files</Trans>
                )}
              </Menu.ItemText>
              <Menu.ItemIcon icon={LibraryIcon} />
            </Menu.Item>
          </Menu.Group>
          {!!avatar && (
            <>
              <Menu.Divider />
              <Menu.Group>
                <Menu.Item
                  testID="changeAvatarRemoveBtn"
                  label={_(msg`Remove Avatar`)}
                  onPress={onRemoveAvatar}>
                  <Menu.ItemText>
                    <Trans>Remove Avatar</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={TrashIcon} />
                </Menu.Item>
              </Menu.Group>
            </>
          )}
        </Menu.Outer>
      </Menu.Root>

      <EditImageDialog
        control={editImageDialogControl}
        image={rawImage}
        onChange={onChangeEditImage}
        aspectRatio={1}
        circularCrop={circular}
      />
    </>
  )
}
EditableUserAvatar = memo(EditableUserAvatar)
export {EditableUserAvatar}

let PreviewableUserAvatar = ({
  moderation,
  profile,
  disableHoverCard,
  disableNavigation,
  disableLink,
  onBeforePress,
  live,
  ...props
}: PreviewableUserAvatarProps): React.ReactNode => {
  const ax = useAnalytics()
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const status = useActorStatus(profile)
  const liveControl = useDialogControl()
  const playHaptic = useHaptics()

  const onPress = useCallback(() => {
    onBeforePress?.()
    unstableCacheProfileView(queryClient, profile)
  }, [profile, queryClient, onBeforePress])

  const onOpenLiveStatus = () => {
    playHaptic('Light')
    ax.metric('live:card:open', {subject: profile.did, from: 'post'})
    liveControl.open()
  }

  const avatarEl = (
    <UserAvatar
      avatar={profile.avatar}
      moderation={moderation}
      type={profile.associated?.labeler ? 'labeler' : 'user'}
      live={status.isActive || live}
      {...props}
    />
  )

  const linkStyle =
    props.type !== 'algo' && props.type !== 'list'
      ? a.rounded_full
      : {borderRadius: props.size > 32 ? 8 : 3}

  return (
    <ProfileHoverCard did={profile.did} disable={disableHoverCard}>
      {disableNavigation ? (
        avatarEl
      ) : status.isActive && (IS_NATIVE || IS_WEB_TOUCH_DEVICE) ? (
        <>
          <Button
            label={_(
              msg`${sanitizeDisplayName(
                profile.displayName || sanitizeHandle(profile.handle),
              )}'s avatar`,
            )}
            accessibilityHint={_(msg`Opens live status dialog`)}
            onPress={onOpenLiveStatus}>
            {avatarEl}
          </Button>
          <LiveStatusDialog
            control={liveControl}
            profile={profile}
            status={status}
            embed={status.embed}
          />
        </>
      ) : disableLink ? (
        avatarEl
      ) : (
        <Link
          label={_(
            msg`${sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
            )}'s avatar`,
          )}
          accessibilityHint={_(msg`Opens this profile`)}
          to={makeProfileLink({
            did: profile.did,
            handle: profile.handle,
          })}
          onPress={onPress}
          style={linkStyle}>
          {avatarEl}
        </Link>
      )}
    </ProfileHoverCard>
  )
}
PreviewableUserAvatar = memo(PreviewableUserAvatar)
export {PreviewableUserAvatar}

// HACK
// We have started serving smaller avis but haven't updated lexicons to give the data properly
// manually string-replace to use the smaller ones
// -prf
function hackModifyThumbnailPath(uri: string, isEnabled: boolean): string {
  return isEnabled ? convertCdnPreset(uri, 'avatar_thumbnail') : uri
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
  },
})
