import {useCallback, useEffect, useState} from 'react'
import {Dimensions, View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {urls} from '#/lib/constants'
import {cleanError} from '#/lib/strings/errors'
import {useWarnMaxGraphemeCount} from '#/lib/strings/helpers'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {type ImageMeta} from '#/state/gallery'
import {useProfileUpdateMutation} from '#/state/queries/profile'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import * as Toast from '#/view/com/util/Toast'
import {EditableUserAvatar} from '#/view/com/util/UserAvatar'
import {UserBanner} from '#/view/com/util/UserBanner'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {useSimpleVerificationState} from '#/components/verification'

const DISPLAY_NAME_MAX_GRAPHEMES = 64
const DESCRIPTION_MAX_GRAPHEMES = 256

const SCREEN_HEIGHT = Dimensions.get('window').height

export function EditProfileDialog({
  profile,
  control,
  onUpdate,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  control: Dialog.DialogControlProps
  onUpdate?: () => void
}) {
  const {_} = useLingui()
  const cancelControl = Dialog.useDialogControl()
  const [dirty, setDirty] = useState(false)

  // 'You might lose unsaved changes' warning
  useEffect(() => {
    if (isWeb && dirty) {
      const abortController = new AbortController()
      const {signal} = abortController
      window.addEventListener('beforeunload', evt => evt.preventDefault(), {
        signal,
      })
      return () => {
        abortController.abort()
      }
    }
  }, [dirty])

  const onPressCancel = useCallback(() => {
    if (dirty) {
      cancelControl.open()
    } else {
      control.close()
    }
  }, [dirty, control, cancelControl])

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{
        preventDismiss: dirty,
        minHeight: SCREEN_HEIGHT,
      }}
      testID="editProfileModal">
      <DialogInner
        profile={profile}
        onUpdate={onUpdate}
        setDirty={setDirty}
        onPressCancel={onPressCancel}
      />

      <Prompt.Basic
        control={cancelControl}
        title={_(msg`Discard changes?`)}
        description={_(msg`Are you sure you want to discard your changes?`)}
        onConfirm={() => control.close()}
        confirmButtonCta={_(msg`Discard`)}
        confirmButtonColor="negative"
      />
    </Dialog.Outer>
  )
}

function DialogInner({
  profile,
  onUpdate,
  setDirty,
  onPressCancel,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  onUpdate?: () => void
  setDirty: (dirty: boolean) => void
  onPressCancel: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogContext()
  const verification = useSimpleVerificationState({
    profile,
  })
  const {
    mutateAsync: updateProfileMutation,
    error: updateProfileError,
    isError: isUpdateProfileError,
    isPending: isUpdatingProfile,
  } = useProfileUpdateMutation()
  const [imageError, setImageError] = useState('')
  const initialDisplayName = profile.displayName || ''
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const initialDescription = profile.description || ''
  const [description, setDescription] = useState(initialDescription)
  const [userBanner, setUserBanner] = useState<string | undefined | null>(
    profile.banner,
  )
  const [userAvatar, setUserAvatar] = useState<string | undefined | null>(
    profile.avatar,
  )
  const [newUserBanner, setNewUserBanner] = useState<
    ImageMeta | undefined | null
  >()
  const [newUserAvatar, setNewUserAvatar] = useState<
    ImageMeta | undefined | null
  >()

  const dirty =
    displayName !== initialDisplayName ||
    description !== initialDescription ||
    userAvatar !== profile.avatar ||
    userBanner !== profile.banner

  useEffect(() => {
    setDirty(dirty)
  }, [dirty, setDirty])

  const onSelectNewAvatar = useCallback(
    (img: ImageMeta | null) => {
      setImageError('')
      if (img === null) {
        setNewUserAvatar(null)
        setUserAvatar(null)
        return
      }
      try {
        setNewUserAvatar(img)
        setUserAvatar(img.path)
      } catch (e: any) {
        setImageError(cleanError(e))
      }
    },
    [setNewUserAvatar, setUserAvatar, setImageError],
  )

  const onSelectNewBanner = useCallback(
    (img: ImageMeta | null) => {
      setImageError('')
      if (!img) {
        setNewUserBanner(null)
        setUserBanner(null)
        return
      }
      try {
        setNewUserBanner(img)
        setUserBanner(img.path)
      } catch (e: any) {
        setImageError(cleanError(e))
      }
    },
    [setNewUserBanner, setUserBanner, setImageError],
  )

  const onPressSave = useCallback(async () => {
    setImageError('')
    try {
      await updateProfileMutation({
        profile,
        updates: {
          displayName: displayName.trimEnd(),
          description: description.trimEnd(),
        },
        newUserAvatar,
        newUserBanner,
      })
      onUpdate?.()
      control.close()
      Toast.show(_(msg({message: 'Profile updated', context: 'toast'})))
    } catch (e: any) {
      logger.error('Failed to update user profile', {message: String(e)})
    }
  }, [
    updateProfileMutation,
    profile,
    onUpdate,
    control,
    displayName,
    description,
    newUserAvatar,
    newUserBanner,
    setImageError,
    _,
  ])

  const displayNameTooLong = useWarnMaxGraphemeCount({
    text: displayName,
    maxCount: DISPLAY_NAME_MAX_GRAPHEMES,
  })
  const descriptionTooLong = useWarnMaxGraphemeCount({
    text: description,
    maxCount: DESCRIPTION_MAX_GRAPHEMES,
  })

  const cancelButton = useCallback(
    () => (
      <Button
        label={_(msg`Cancel`)}
        onPress={onPressCancel}
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}
        testID="editProfileCancelBtn">
        <ButtonText style={[a.text_md]}>
          <Trans>Cancel</Trans>
        </ButtonText>
      </Button>
    ),
    [onPressCancel, _],
  )

  const saveButton = useCallback(
    () => (
      <Button
        label={_(msg`Save`)}
        onPress={onPressSave}
        disabled={
          !dirty ||
          isUpdatingProfile ||
          displayNameTooLong ||
          descriptionTooLong
        }
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}
        testID="editProfileSaveBtn">
        <ButtonText style={[a.text_md, !dirty && t.atoms.text_contrast_low]}>
          <Trans>Save</Trans>
        </ButtonText>
        {isUpdatingProfile && <ButtonIcon icon={Loader} />}
      </Button>
    ),
    [
      _,
      t,
      dirty,
      onPressSave,
      isUpdatingProfile,
      displayNameTooLong,
      descriptionTooLong,
    ],
  )

  return (
    <Dialog.ScrollableInner
      label={_(msg`Edit profile`)}
      style={[a.overflow_hidden]}
      contentContainerStyle={[a.px_0, a.pt_0]}
      header={
        <Dialog.Header renderLeft={cancelButton} renderRight={saveButton}>
          <Dialog.HeaderText>
            <Trans>Edit profile</Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
      }>
      <View style={[a.relative]}>
        <UserBanner banner={userBanner} onSelectNewBanner={onSelectNewBanner} />
        <View
          style={[
            a.absolute,
            {
              top: 80,
              left: 20,
              width: 84,
              height: 84,
              borderWidth: 2,
              borderRadius: 42,
              borderColor: t.atoms.bg.backgroundColor,
            },
          ]}>
          <EditableUserAvatar
            size={80}
            avatar={userAvatar}
            onSelectNewAvatar={onSelectNewAvatar}
          />
        </View>
      </View>
      {isUpdateProfileError && (
        <View style={[a.mt_xl]}>
          <ErrorMessage message={cleanError(updateProfileError)} />
        </View>
      )}
      {imageError !== '' && (
        <View style={[a.mt_xl]}>
          <ErrorMessage message={imageError} />
        </View>
      )}
      <View style={[a.mt_4xl, a.px_xl, a.gap_xl]}>
        <View>
          <TextField.LabelText>
            <Trans>Display name</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={displayNameTooLong}>
            <Dialog.Input
              defaultValue={displayName}
              onChangeText={setDisplayName}
              label={_(msg`Display name`)}
              placeholder={_(msg`e.g. Alice Lastname`)}
              testID="editProfileDisplayNameInput"
            />
          </TextField.Root>
          {displayNameTooLong && (
            <TextField.SuffixText
              style={[
                a.text_sm,
                a.mt_xs,
                a.font_bold,
                {color: t.palette.negative_400},
              ]}
              label={_(msg`Display name is too long`)}>
              <Trans>
                Display name is too long.{' '}
                <Plural
                  value={DISPLAY_NAME_MAX_GRAPHEMES}
                  other="The maximum number of characters is #."
                />
              </Trans>
            </TextField.SuffixText>
          )}
        </View>

        {verification.isVerified &&
          verification.role === 'default' &&
          displayName !== initialDisplayName && (
            <Admonition type="error">
              <Trans>
                You are verified. You will lose your verification status if you
                change your display name.{' '}
                <InlineLinkText
                  label={_(msg`Learn more`)}
                  to={urls.website.blog.initialVerificationAnnouncement}>
                  <Trans>Learn more.</Trans>
                </InlineLinkText>
              </Trans>
            </Admonition>
          )}

        <View>
          <TextField.LabelText>
            <Trans>Description</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={descriptionTooLong}>
            <Dialog.Input
              defaultValue={description}
              onChangeText={setDescription}
              multiline
              label={_(msg`Display name`)}
              placeholder={_(msg`Tell us a bit about yourself`)}
              testID="editProfileDescriptionInput"
            />
          </TextField.Root>
          {descriptionTooLong && (
            <TextField.SuffixText
              style={[
                a.text_sm,
                a.mt_xs,
                a.font_bold,
                {color: t.palette.negative_400},
              ]}
              label={_(msg`Description is too long`)}>
              <Trans>
                Description is too long.{' '}
                <Plural
                  value={DESCRIPTION_MAX_GRAPHEMES}
                  other="The maximum number of characters is #."
                />
              </Trans>
            </TextField.SuffixText>
          )}
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
