import {useCallback, useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Plural, Trans} from '@lingui/react/macro'

import {MAX_DESCRIPTION, MAX_DISPLAY_NAME, urls} from '#/lib/constants'
import {useCallOnce} from '#/lib/once'
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
import {Pencil_Stroke2_Corner2_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {PlusSmall_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useSimpleVerificationState} from '#/components/verification'
import {useAnalytics} from '#/analytics'
import {
  logProfileLinkChanges,
  type ProfileLink,
  ProfileLinksEditor,
  sameProfileLinks,
  useCanEditProfileLinks,
  useOwnProfileLinksQuery,
  useSetOwnProfileLinksCache,
  useWriteProfileLinks,
} from '#/features/profileLinks'
import {
  PILL_DASHED_BORDER,
  PILL_LEFT,
  PILL_RIGHT_GRIP,
  PILL_RIGHT_TEXT,
  PILL_VERTICAL,
} from '#/features/profileLinks/pillSize'
import {type app} from '#/lexicons'
import {PRONOUN_SUGGESTIONS, PronounsDialog} from './PronounsDialog'
import {describePronounsChange} from './pronounSuggestions'

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
  const [dirty, setDirty] = useState(false)

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
  profile: app.bsky.actor.defs.ProfileViewDetailed
  onUpdate?: () => void
  setDirty: (dirty: boolean) => void
  onPressCancel: () => void
}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const control = Dialog.useDialogContext()
  // the dialog's contents mount on every open, so this fires once per open
  useCallOnce(() => {
    ax.metric('profile:edit:open', {})
  })()
  const verification = useSimpleVerificationState({
    profile,
  })
  const {
    mutateAsync: updateProfileMutation,
    error: updateProfileError,
    isError: isUpdateProfileError,
  } = useProfileUpdateMutation()
  /*
   * Covers the whole save, not just the profile mutation: links are written
   * first, and a second save started meanwhile would create every new link's
   * record again. The ref catches a second press before the re-render.
   */
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)
  const [imageError, setImageError] = useState('')
  const initialDisplayName = profile.displayName || ''
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const initialDescription = profile.description || ''
  const [description, setDescription] = useState(initialDescription)
  const initialPronouns = profile.pronouns || ''
  const [pronouns, setPronouns] = useState(initialPronouns)
  const pronounsControl = Dialog.useDialogControl()
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

  const linksEnabled = useCanEditProfileLinks()
  const {data: storedLinks} = useOwnProfileLinksQuery(profile.did, {
    enabled: linksEnabled,
  })
  const writeProfileLinks = useWriteProfileLinks()
  const setOwnProfileLinksCache = useSetOwnProfileLinksCache()
  /*
   * Unset until the owner edits their links, so edits always start from the
   * loaded records and a save can't overwrite links that hadn't loaded yet.
   */
  const [editedLinks, setEditedLinks] = useState<ProfileLink[]>()
  const links = editedLinks ?? storedLinks
  const linksLoaded = !!storedLinks

  useEffect(() => {
    if (!linksEnabled || !storedLinks) return
    ax.metric('profile:links:editorOpen', {
      linkCount: storedLinks.length,
    })
    // Once, when the links first load.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [linksEnabled, linksLoaded])
  const [isDraggingLinks, setIsDraggingLinks] = useState(false)
  // on Android the sheet turns its own drag off while scrolled, so put that back after
  const sheetDragWasDisabled = useRef(false)

  const profileDirty =
    displayName !== initialDisplayName ||
    description !== initialDescription ||
    pronouns !== initialPronouns ||
    userAvatar !== profile.avatar ||
    userBanner !== profile.banner
  const linksDirty =
    !!editedLinks &&
    !!storedLinks &&
    !sameProfileLinks(editedLinks, storedLinks)
  const dirty = profileDirty || linksDirty

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
    if (isSavingRef.current) return
    isSavingRef.current = true
    setIsSaving(true)
    setImageError('')
    try {
      const nextLinks = linksDirty ? editedLinks : undefined
      // the profile can only point at link records that already exist
      const written = nextLinks
        ? await writeProfileLinks(profile.did, nextLinks, storedLinks ?? [])
        : undefined
      await updateProfileMutation({
        profile,
        updates: {
          displayName: displayName.trimEnd(),
          description: description.trimEnd(),
          ...(pronouns !== initialPronouns && {pronouns: pronouns.trim()}),
          ...(written && {
            links: written.refs.length ? written.refs : undefined,
          }),
        },
        newUserAvatar,
        newUserBanner,
      })
      const pronounsChange = describePronounsChange(
        initialPronouns,
        pronouns,
        PRONOUN_SUGGESTIONS.map(s => i18n._(s)),
      )
      if (pronounsChange) {
        ax.metric('profile:pronouns:save', pronounsChange)
      }
      if (nextLinks && written) {
        logProfileLinkChanges(
          ax,
          storedLinks ?? [],
          nextLinks.map((link, i) => ({...link, uri: written.refs[i].uri})),
        )
        setOwnProfileLinksCache(profile.did, nextLinks, written.refs)
        await written.deleteRemoved()
      }
      control.close(() => onUpdate?.())
      Toast.show(_(msg({message: 'Profile updated', context: 'toast'})))
    } catch (e: any) {
      logger.error('Failed to update user profile', {message: String(e)})
      // left set on success, so Save stays off while the dialog closes
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [
    updateProfileMutation,
    profile,
    onUpdate,
    control,
    displayName,
    description,
    pronouns,
    initialPronouns,
    newUserAvatar,
    newUserBanner,
    setImageError,
    _,
    i18n,
    editedLinks,
    linksDirty,
    storedLinks,
    ax,
    writeProfileLinks,
    setOwnProfileLinksCache,
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
          !dirty || isSaving || displayNameTooLong || descriptionTooLong
        }
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}
        testID="editProfileSaveBtn">
        <ButtonText style={[a.text_md, !dirty && t.atoms.text_contrast_low]}>
          <Trans>Save</Trans>
        </ButtonText>
        {isSaving && <ButtonIcon icon={Loader} />}
      </Button>
    ),
    [
      _,
      t,
      dirty,
      onPressSave,
      isSaving,
      displayNameTooLong,
      descriptionTooLong,
    ],
  )

  return (
    <Dialog.ScrollableInner
      label={_(msg`Edit profile`)}
      scrollEnabled={!isDraggingLinks}
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
              value={displayName}
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
            <Trans>Pronouns</Trans>
          </TextField.LabelText>
          {/*
           * A pill that opens a sheet, rather than a full field, so pronouns
           * stay optional and out of the way. It matches the link pills.
           */}
          <View style={[a.flex_row]}>
            <Button
              testID="editProfilePronounsBtn"
              label={
                pronouns
                  ? _(msg`Edit pronouns: ${pronouns}`)
                  : _(msg`Add pronouns`)
              }
              size="small"
              color="secondary"
              // unset, it matches the dashed "Add link" pill
              variant={pronouns ? 'solid' : 'outline'}
              onPress={() => pronounsControl.open()}
              style={
                pronouns
                  ? {
                      paddingVertical: PILL_VERTICAL,
                      // starts with text, ends in a pencil sized like the drag grip
                      paddingLeft: PILL_RIGHT_TEXT,
                      paddingRight: PILL_RIGHT_GRIP,
                    }
                  : {
                      // the outline variant draws a hairline on native; this wants a full point
                      borderStyle: 'dashed',
                      borderWidth: PILL_DASHED_BORDER,
                      borderColor: t.palette.contrast_600,
                      // less the border, so it's the same size as the solid pills
                      paddingVertical: PILL_VERTICAL - PILL_DASHED_BORDER,
                      paddingLeft: PILL_LEFT - PILL_DASHED_BORDER,
                      paddingRight: PILL_RIGHT_TEXT - PILL_DASHED_BORDER,
                    }
              }>
              {pronouns ? (
                <>
                  <ButtonText emoji numberOfLines={1} style={t.atoms.text}>
                    {pronouns}
                  </ButtonText>
                  {/* sized and colored like the drag grip on the link pills */}
                  <PencilIcon
                    width={14}
                    style={[{marginLeft: -2}, t.atoms.text_contrast_low]}
                  />
                </>
              ) : (
                <>
                  <ButtonIcon icon={PlusIcon} />
                  <ButtonText style={{marginLeft: -2}}>
                    <Trans>Add pronouns</Trans>
                  </ButtonText>
                </>
              )}
            </Button>
          </View>
          <PronounsDialog
            control={pronounsControl}
            pronouns={pronouns}
            onSave={setPronouns}
          />
        </View>

        <View>
          <TextField.LabelText>
            <Trans>Description</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={descriptionTooLong}>
            <Dialog.Input
              value={description}
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

        {linksEnabled && links && (
          <ProfileLinksEditor
            did={profile.did}
            links={links}
            onChange={setEditedLinks}
            onDragStateChange={dragging => {
              setIsDraggingLinks(dragging)
              if (dragging) {
                sheetDragWasDisabled.current = control.disableDrag
                control.setDisableDrag(true)
              } else {
                control.setDisableDrag(sheetDragWasDisabled.current)
              }
            }}
          />
        )}
      </View>
    </Dialog.ScrollableInner>
  )
}
