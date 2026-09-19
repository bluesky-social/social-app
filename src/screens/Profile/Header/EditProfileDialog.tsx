import {useCallback, useEffect, useState} from 'react'
import {Pressable, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Plural, Trans} from '@lingui/react/macro'

import {MAX_DESCRIPTION, MAX_DISPLAY_NAME, urls} from '#/lib/constants'
import {cleanError} from '#/lib/strings/errors'
import {isOverMaxGraphemeCount} from '#/lib/strings/helpers'
import {logger} from '#/logger'
import {type ImageMeta} from '#/state/gallery'
import {useProfileUpdateMutation} from '#/state/queries/profile'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {EditableUserAvatar} from '#/view/com/util/UserAvatar'
import {UserBanner} from '#/view/com/util/UserBanner'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLink} from '#/components/icons/ChainLink'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useSimpleVerificationState} from '#/components/verification'
import {
  formatSupportUri,
  SupportLinkDialog,
  useMySupportLink,
} from '#/features/supportButton'
import {type app} from '#/lexicons'

export function EditProfileDialog({
  profile,
  control,
  onUpdate,
}: {
  profile: app.bsky.actor.defs.ProfileViewDetailed
  control: Dialog.DialogControlProps
  onUpdate?: () => void
}) {
  const {_} = useLingui()
  const cancelControl = Dialog.useDialogControl()
  const supportLinkControl = Dialog.useDialogControl()
  const [dirty, setDirty] = useState(false)
  /*
   * The Support sheet stores its link immediately, so Edit Profile only needs
   * to know that something changed in this session to light up Save.
   */
  const [supportLinkDirty, setSupportLinkDirty] = useState(false)

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
      // this component outlives the sheet, so the flag has to reset by hand
      onClose={() => setSupportLinkDirty(false)}
      nativeOptions={{
        preventDismiss: dirty,
        fullHeight: true,
      }}
      webOptions={{
        onBackgroundPress: () => {
          if (dirty) {
            cancelControl.open()
          } else {
            control.close()
          }
        },
      }}
      testID="editProfileModal">
      <DialogInner
        profile={profile}
        onUpdate={onUpdate}
        setDirty={setDirty}
        onPressCancel={onPressCancel}
        supportLinkControl={supportLinkControl}
        supportLinkDirty={supportLinkDirty}
      />

      <SupportLinkDialog
        control={supportLinkControl}
        onSaved={() => setSupportLinkDirty(true)}
        onRemoved={() => setSupportLinkDirty(true)}
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
  supportLinkControl,
  supportLinkDirty,
}: {
  profile: app.bsky.actor.defs.ProfileViewDetailed
  onUpdate?: () => void
  setDirty: (dirty: boolean) => void
  onPressCancel: () => void
  supportLinkControl: Dialog.DialogControlProps
  supportLinkDirty: boolean
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
  const {link: supportLink} = useMySupportLink()
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

  const profileDirty =
    displayName !== initialDisplayName ||
    description !== initialDescription ||
    userAvatar !== profile.avatar ||
    userBanner !== profile.banner
  /*
   * Save lights up for a Support link change too, but only profile edits are
   * "unsaved": the link is already stored, so Cancel has nothing to discard.
   */
  const dirty = profileDirty || supportLinkDirty

  useEffect(() => {
    setDirty(profileDirty)
  }, [profileDirty, setDirty])

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
    // Only the Support link changed; it's already stored, so nothing to upload.
    if (!profileDirty) {
      control.close(() => onUpdate?.())
      Toast.show(_(msg({message: 'Profile updated', context: 'toast'})))
      return
    }
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
      control.close(() => onUpdate?.())
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
    profileDirty,
    setImageError,
    _,
  ])

  const displayNameTooLong = isOverMaxGraphemeCount({
    text: displayName,
    maxCount: MAX_DISPLAY_NAME,
  })
  const descriptionTooLong = isOverMaxGraphemeCount({
    text: description,
    maxCount: MAX_DESCRIPTION,
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
            <Text
              style={[
                a.text_sm,
                a.mt_xs,
                a.font_semi_bold,
                {color: t.palette.negative_400},
              ]}>
              <Plural
                value={MAX_DISPLAY_NAME}
                other="Display name is too long. The maximum number of characters is #."
              />
            </Text>
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
                  label={_(
                    msg({
                      message: `Learn more`,
                      context: `english-only-resource`,
                    }),
                  )}
                  to={urls.website.blog.initialVerificationAnnouncement}>
                  <Trans context="english-only-resource">Learn more.</Trans>
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
              label={_(msg`Description`)}
              placeholder={_(msg`Tell us a bit about yourself`)}
              testID="editProfileDescriptionInput"
            />
          </TextField.Root>
          {descriptionTooLong && (
            <Text
              style={[
                a.text_sm,
                a.mt_xs,
                a.font_semi_bold,
                {color: t.palette.negative_400},
              ]}>
              <Plural
                value={MAX_DESCRIPTION}
                other="Description is too long. The maximum number of characters is #."
              />
            </Text>
          )}
        </View>

        <View>
          <TextField.LabelText>
            <Trans>Support button</Trans>
          </TextField.LabelText>
          {/*
           * Read-only, so plain text rather than a disabled input: iOS wraps a
           * long URL at the slash inside an input and hides the rest. Tapping
           * anywhere on the row opens the sheet.
           */}
          <Pressable
            testID="editProfileSupportLinkField"
            accessibilityRole="button"
            accessibilityLabel={
              supportLink
                ? _(msg`Edit Support button`)
                : _(msg`Add Support button`)
            }
            accessibilityHint={_(msg`Opens the Support button sheet`)}
            onPress={() => supportLinkControl.open()}
            style={[
              a.flex_row,
              a.align_center,
              a.pl_md,
              t.atoms.bg_contrast_50,
              {paddingRight: 6, paddingVertical: 6, borderRadius: 10},
            ]}>
            <TextField.Icon icon={ChainLink} />
            <Text
              numberOfLines={1}
              style={[
                a.flex_1,
                a.text_md,
                a.px_xs,
                supportLink ? t.atoms.text : {color: t.palette.contrast_300},
              ]}>
              {supportLink
                ? formatSupportUri(supportLink.uri)
                : 'patreon.com/yourname'}
            </Text>
            <Button
              testID="editProfileEditSupportBtn"
              label={
                supportLink
                  ? _(msg`Edit Support button`)
                  : _(msg`Add Support button`)
              }
              size="small"
              color="secondary"
              onPress={() => supportLinkControl.open()}>
              <ButtonText>
                {supportLink ? <Trans>Edit</Trans> : <Trans>Add</Trans>}
              </ButtonText>
            </Button>
          </Pressable>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
