import React from 'react'
import {View} from 'react-native'
import Svg, {Path} from 'react-native-svg'
import {Image as ExpoImage} from 'expo-image'
import {
  type ImagePickerOptions,
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
import {DescriptionText, TitleText} from '#/screens/Onboarding2/Layout'
import {Context} from '#/screens/Onboarding2/state'
import {AvatarCircle} from '#/screens/Onboarding2/StepProfile/AvatarCircle'
import {AvatarCreatorCircle} from '#/screens/Onboarding2/StepProfile/AvatarCreatorCircle'
import {AvatarCreatorItems} from '#/screens/Onboarding2/StepProfile/AvatarCreatorItems'
import {
  PlaceholderCanvas,
  type PlaceholderCanvasRef,
} from '#/screens/Onboarding2/StepProfile/PlaceholderCanvas'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {CircleInfo_Stroke2_Corner0_Rounded} from '#/components/icons/CircleInfo'
import {Text} from '#/components/Typography'
import {type AvatarColor, avatarColors, type Emoji, emojiItems} from './types'

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

export function StepProfile({
  onGoBack,
  handle,
}: {
  onGoBack?: () => void
  handle?: string
}) {
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
        imageUri: image.path,
        shape: 'circle',
        aspectRatio: 1 / 1,
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
        <View style={[a.mb_md]}>
          <Svg width={43} height={42} viewBox="0 0 43 42" fill="none">
            <Path
              d="M28.1292 13.6071C28.9576 13.6071 29.6292 14.2787 29.6292 15.1071C29.6292 15.375 29.5579 15.6258 29.4348 15.8435C29.558 16.0613 29.6292 16.3127 29.6292 16.5808C29.629 17.3574 29.0389 17.9963 28.2825 18.073L28.1292 18.0808L27.9007 18.0691C26.7729 17.9545 25.8929 17.0015 25.8929 15.8435C25.893 14.6085 26.8942 13.6073 28.1292 13.6071Z"
              fill="#C30B0D"
            />
            <Path
              d="M28.1295 13.6071C29.3646 13.6071 30.3656 14.6084 30.3658 15.8435C30.3658 17.0787 29.3647 18.0808 28.1295 18.0808C27.3012 18.0808 26.6297 17.409 26.6295 16.5808C26.6295 16.3128 26.7006 16.0612 26.8238 15.8435C26.7008 15.6258 26.6295 15.375 26.6295 15.1071C26.6295 14.2787 27.301 13.6071 28.1295 13.6071Z"
              fill="#C30B0D"
            />
            <Path
              d="M14.8702 13.6071C15.6987 13.6071 16.3702 14.2787 16.3702 15.1071C16.3702 15.375 16.299 15.6258 16.1759 15.8435C16.2991 16.0613 16.3702 16.3127 16.3702 16.5808C16.37 17.3574 15.78 17.9963 15.0236 18.073L14.8702 18.0808L14.6417 18.0691C13.5139 17.9545 12.6339 17.0015 12.6339 15.8435C12.6341 14.6085 13.6352 13.6073 14.8702 13.6071Z"
              fill="#C30B0D"
            />
            <Path
              d="M14.8705 13.6071C16.1057 13.6071 17.1067 14.6084 17.1068 15.8435C17.1068 17.0787 16.1058 18.0808 14.8705 18.0808C14.0422 18.0808 13.3707 17.409 13.3705 16.5808C13.3705 16.3128 13.4417 16.0612 13.5648 15.8435C13.4418 15.6258 13.3705 15.375 13.3705 15.1071C13.3705 14.2787 14.0421 13.6071 14.8705 13.6071Z"
              fill="#C30B0D"
            />
            <Path
              d="M39.1519 20.9996C39.1517 11.2509 31.2484 3.34821 21.4996 3.34821C11.7511 3.34843 3.84843 11.2511 3.84821 20.9996C3.84821 30.7484 11.7509 38.6517 21.4996 38.6519C31.2485 38.6519 39.1519 30.7485 39.1519 20.9996ZM42.1519 20.9996C42.1519 32.4054 32.9054 41.6519 21.4996 41.6519C10.0941 41.6517 0.848206 32.4053 0.848206 20.9996C0.848431 9.59424 10.0942 0.348431 21.4996 0.348206C32.9053 0.348206 42.1517 9.59411 42.1519 20.9996Z"
              fill="#C30B0D"
            />
            <Path
              d="M30.038 23.9609C30.8596 24.0671 31.44 24.819 31.3339 25.6406L31.2772 25.9609C31.1136 26.7042 30.7297 27.4151 30.2997 28.0156C29.7911 28.7259 29.1293 29.4067 28.3973 29.9668C27.6654 30.5268 26.8351 30.9877 26.0165 31.293C25.3244 31.551 24.5376 31.7358 23.7772 31.6992L23.453 31.6699L23.3026 31.6416C22.5637 31.4629 22.0656 30.7498 22.1708 29.9805C22.2762 29.211 22.948 28.6579 23.7079 28.6846L23.8612 28.6972L24.0272 28.7031C24.2321 28.6944 24.5509 28.6382 24.9686 28.4824C25.498 28.285 26.0682 27.971 26.5741 27.584C27.0798 27.197 27.5313 26.7287 27.8602 26.2695C28.2063 25.7862 28.3363 25.4262 28.3583 25.2558L28.3856 25.1045C28.5588 24.3645 29.268 23.8616 30.038 23.9609Z"
              fill="#C30B0D"
            />
          </Svg>
        </View>
        <TitleText>
          <Trans>Almost done! {'\n'}Add a profile photo?</Trans>
        </TitleText>
        <DescriptionText
          style={[
            {
              fontSize: 17,
              color: '#000000',
            },
          ]}>
          <Trans>
            Show people your flair by uploading a photo or creating an avatar.
          </Trans>
        </DescriptionText>
        <View
          style={[a.w_full, a.align_center, {paddingTop: gtMobile ? 80 : 40}]}>
          <AvatarCircle
            openLibrary={openLibrary}
            openCreator={creatorControl.open}
            handle={handle}
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
                a.h_full,
                t.atoms.bg_contrast_25,
                t.atoms.border_contrast_low,
              ]}>
              <CircleInfo_Stroke2_Corner0_Rounded size="sm" />
              <Text style={[a.leading_snug]}>{error}</Text>
            </View>
          )}
        </View>

        <View style={[a.mt_lg]}>
          <Button
            label={_(msg`Choose an avatar instead`)}
            variant="ghost"
            onPress={creatorControl.open}
            style={[a.p_0, a.bg_transparent]}>
            <Text
              style={[
                {
                  fontSize: 17,
                  fontWeight: '500',
                  color: '#000000',
                  textDecorationLine: 'underline',
                },
              ]}>
              Choose an avatar instead
            </Text>
          </Button>
        </View>

        <View
          style={[
            a.border_t,
            a.mt_lg,
            a.w_full,
            {borderColor: '#D8D8D8', borderWidth: 1},
          ]}
        />
        <View style={[a.flex_row, a.align_center, a.mt_lg]}>
          <Button
            label={_(msg`Go back to previous step`)}
            variant="solid"
            color="secondary"
            size="large"
            onPress={onGoBack || (() => dispatch({type: 'prev'}))}>
            <ButtonText>
              <Trans>Back</Trans>
            </ButtonText>
          </Button>
          <View style={a.flex_1} />
          <Button
            testID="nextBtn"
            label={_(msg`Continue to next step`)}
            variant="solid"
            color="primary"
            size="large"
            onPress={onContinue}>
            <ButtonText>
              <Trans>Next</Trans>
            </ButtonText>
            {/* <ButtonIcon icon={ChevronRight} position="right" /> */}
          </Button>
        </View>
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
