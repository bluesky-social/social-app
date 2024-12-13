import React from 'react'
import {View} from 'react-native'
import {Image as ExpoImage} from 'expo-image'
import {
  ImagePickerOptions,
  launchImageLibraryAsync,
  MediaTypeOptions,
} from 'expo-image-picker'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePhotoLibraryPermission} from '#/lib/hooks/usePermissions'
import {compressIfNeeded} from '#/lib/media/manip'
import {openCropper} from '#/lib/media/picker'
import {getDataUriSize} from '#/lib/media/util'
import {useRequestNotificationsPermission} from '#/lib/notifications/notifications'
import {logEvent, useGate} from '#/lib/statsig/statsig'
import {isNative, isWeb} from '#/platform/detection'
import {
  DescriptionText,
  OnboardingControls,
  TitleText,
} from '#/screens/Onboarding/Layout'
import {Context} from '#/screens/Onboarding/state'
import {AvatarCircle} from '#/screens/Onboarding/StepProfile/AvatarCircle'
import {AvatarCreatorCircle} from '#/screens/Onboarding/StepProfile/AvatarCreatorCircle'
import {AvatarCreatorItems} from '#/screens/Onboarding/StepProfile/AvatarCreatorItems'
import {
  PlaceholderCanvas,
  PlaceholderCanvasRef,
} from '#/screens/Onboarding/StepProfile/PlaceholderCanvas'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {IconCircle} from '#/components/IconCircle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {CircleInfo_Stroke2_Corner0_Rounded} from '#/components/icons/CircleInfo'
import {StreamingLive_Stroke2_Corner0_Rounded as StreamingLive} from '#/components/icons/StreamingLive'
import {Text} from '#/components/Typography'
import {AvatarColor, avatarColors, Emoji, emojiItems} from './types'

export interface Avatar {
  image?: {
    path: string
    mime: string
    size: number
    width: number
    height: number
  }
  backgroundColor: AvatarColor
  placeholder: Emoji
  useCreatedAvatar: boolean
}

interface IAvatarContext {
  avatar: Avatar
  setAvatar: React.Dispatch<React.SetStateAction<Avatar>>
}

const AvatarContext = React.createContext<IAvatarContext>({} as IAvatarContext)
export const useAvatar = () => React.useContext(AvatarContext)

const randomColor =
  avatarColors[Math.floor(Math.random() * avatarColors.length)]

export function StepProfile() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const gate = useGate()
  const requestNotificationsPermission = useRequestNotificationsPermission()

  const creatorControl = Dialog.useDialogControl()
  const [error, setError] = React.useState('')

  const {state, dispatch} = React.useContext(Context)
  const [avatar, setAvatar] = React.useState<Avatar>({
    image: state.profileStepResults?.image,
    placeholder: state.profileStepResults.creatorState?.emoji || emojiItems.at,
    backgroundColor:
      state.profileStepResults.creatorState?.backgroundColor || randomColor,
    useCreatedAvatar: state.profileStepResults.isCreatedAvatar,
  })

  const canvasRef = React.useRef<PlaceholderCanvasRef>(null)

  React.useEffect(() => {
    requestNotificationsPermission('StartOnboarding')
  }, [gate, requestNotificationsPermission])

  const sheetWrapper = useSheetWrapper()
  const openPicker = React.useCallback(
    async (opts?: ImagePickerOptions) => {
      const response = await sheetWrapper(
        launchImageLibraryAsync({
          exif: false,
          mediaTypes: MediaTypeOptions.Images,
          quality: 1,
          ...opts,
          legacy: true,
        }),
      )

      return (response.assets ?? [])
        .slice(0, 1)
        .filter(asset => {
          if (
            !asset.mimeType?.startsWith('image/') ||
            (!asset.mimeType?.endsWith('jpeg') &&
              !asset.mimeType?.endsWith('jpg') &&
              !asset.mimeType?.endsWith('png'))
          ) {
            setError(_(msg`Only .jpg and .png files are supported`))
            return false
          }
          return true
        })
        .map(image => ({
          mime: 'image/jpeg',
          height: image.height,
          width: image.width,
          path: image.uri,
          size: getDataUriSize(image.uri),
        }))
    },
    [_, setError, sheetWrapper],
  )

  const onContinue = React.useCallback(async () => {
    let imageUri = avatar?.image?.path

    // In the event that view-shot didn't load in time and the user pressed continue, this will just be undefined
    // and the default avatar will be used. We don't want to block getting through create if this fails for some
    // reason
    if (!imageUri || avatar.useCreatedAvatar) {
      imageUri = await canvasRef.current?.capture()
    }

    if (imageUri) {
      dispatch({
        type: 'setProfileStepResults',
        image: avatar.image,
        imageUri,
        imageMime: avatar.image?.mime ?? 'image/jpeg',
        isCreatedAvatar: avatar.useCreatedAvatar,
        creatorState: {
          emoji: avatar.placeholder,
          backgroundColor: avatar.backgroundColor,
        },
      })
    }

    dispatch({type: 'next'})
    logEvent('onboarding:profile:nextPressed', {})
  }, [avatar, dispatch])

  const onDoneCreating = React.useCallback(() => {
    setAvatar(prev => ({
      ...prev,
      image: undefined,
      useCreatedAvatar: true,
    }))
    creatorControl.close()
  }, [creatorControl])

  const openLibrary = React.useCallback(async () => {
    if (!(await requestPhotoAccessIfNeeded())) {
      return
    }

    setError('')

    const items = await sheetWrapper(
      openPicker({
        aspect: [1, 1],
      }),
    )
    let image = items[0]
    if (!image) return

    if (!isWeb) {
      image = await openCropper({
        mediaType: 'photo',
        cropperCircleOverlay: true,
        height: 1000,
        width: 1000,
        path: image.path,
      })
    }
    image = await compressIfNeeded(image, 1000000)

    // If we are on mobile, prefetching the image will load the image into memory before we try and display it,
    // stopping any brief flickers.
    if (isNative) {
      await ExpoImage.prefetch(image.path)
    }

    setAvatar(prev => ({
      ...prev,
      image,
      useCreatedAvatar: false,
    }))
  }, [
    requestPhotoAccessIfNeeded,
    setAvatar,
    openPicker,
    setError,
    sheetWrapper,
  ])

  const onSecondaryPress = React.useCallback(() => {
    if (avatar.useCreatedAvatar) {
      openLibrary()
    } else {
      creatorControl.open()
    }
  }, [avatar.useCreatedAvatar, creatorControl, openLibrary])

  const value = React.useMemo(
    () => ({
      avatar,
      setAvatar,
    }),
    [avatar],
  )

  return (
    <AvatarContext.Provider value={value}>
      <View style={[a.align_start, t.atoms.bg, a.justify_between]}>
        <IconCircle icon={StreamingLive} style={[a.mb_2xl]} />
        <TitleText>
          <Trans>Give your profile a face</Trans>
        </TitleText>
        <DescriptionText>
          <Trans>
            Help people know you're not a bot by uploading a picture or creating
            an avatar.
          </Trans>
        </DescriptionText>
        <View
          style={[a.w_full, a.align_center, {paddingTop: gtMobile ? 80 : 40}]}>
          <AvatarCircle
            openLibrary={openLibrary}
            openCreator={creatorControl.open}
          />

          {error && (
            <View
              style={[
                a.flex_row,
                a.gap_sm,
                a.align_center,
                a.mt_xl,
                a.py_md,
                a.px_lg,
                a.border,
                a.rounded_md,
                t.atoms.bg_contrast_25,
                t.atoms.border_contrast_low,
              ]}>
              <CircleInfo_Stroke2_Corner0_Rounded size="sm" />
              <Text style={[a.leading_snug]}>{error}</Text>
            </View>
          )}
        </View>

        <OnboardingControls.Portal>
          <View style={[a.gap_md, gtMobile && {flexDirection: 'row-reverse'}]}>
            <Button
              variant="gradient"
              color="gradient_sky"
              size="large"
              label={_(msg`Continue to next step`)}
              onPress={onContinue}>
              <ButtonText>
                <Trans>Continue</Trans>
              </ButtonText>
              <ButtonIcon icon={ChevronRight} position="right" />
            </Button>
            <Button
              variant="ghost"
              color="primary"
              size="large"
              label={_(msg`Open avatar creator`)}
              onPress={onSecondaryPress}>
              <ButtonText>
                {avatar.useCreatedAvatar ? (
                  <Trans>Upload a photo instead</Trans>
                ) : (
                  <Trans>Create an avatar instead</Trans>
                )}
              </ButtonText>
            </Button>
          </View>
        </OnboardingControls.Portal>
      </View>

      <Dialog.Outer control={creatorControl}>
        <Dialog.Inner
          label="Avatar creator"
          style={[
            {
              width: 'auto',
              maxWidth: 410,
            },
          ]}>
          <View style={[a.align_center, {paddingTop: 20}]}>
            <AvatarCreatorCircle avatar={avatar} />
          </View>

          <View style={[a.pt_3xl, a.gap_lg]}>
            <AvatarCreatorItems
              type="emojis"
              avatar={avatar}
              setAvatar={setAvatar}
            />
            <AvatarCreatorItems
              type="colors"
              avatar={avatar}
              setAvatar={setAvatar}
            />
          </View>
          <View style={[a.pt_4xl]}>
            <Button
              variant="solid"
              color="primary"
              size="large"
              label={_(msg`Done`)}
              onPress={onDoneCreating}>
              <ButtonText>
                <Trans>Done</Trans>
              </ButtonText>
            </Button>
          </View>
        </Dialog.Inner>
      </Dialog.Outer>

      <PlaceholderCanvas ref={canvasRef} />
    </AvatarContext.Provider>
  )
}
