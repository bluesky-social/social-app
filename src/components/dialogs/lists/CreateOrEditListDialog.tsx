import {useCallback, useEffect, useMemo, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {type AppBskyGraphDefs, RichText as RichTextAPI} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {isOverMaxGraphemeCount} from '#/lib/strings/helpers'
import {richTextToString} from '#/lib/strings/rich-text-helpers'
import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'
import {logger} from '#/logger'
import {type ImageMeta} from '#/state/gallery'
import {
  useListCreateMutation,
  useListMetadataMutation,
} from '#/state/queries/list'
import {useAgent} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import * as Toast from '#/view/com/util/Toast'
import {EditableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

const DISPLAY_NAME_MAX_GRAPHEMES = 64
const DESCRIPTION_MAX_GRAPHEMES = 300

export function CreateOrEditListDialog({
  control,
  list,
  purpose,
  onSave,
}: {
  control: Dialog.DialogControlProps
  list?: AppBskyGraphDefs.ListView
  purpose?: AppBskyGraphDefs.ListPurpose
  onSave?: (uri: string) => void
}) {
  const {_} = useLingui()
  const cancelControl = Dialog.useDialogControl()
  const [dirty, setDirty] = useState(false)
  const {height} = useWindowDimensions()

  // 'You might lose unsaved changes' warning
  useEffect(() => {
    if (IS_WEB && dirty) {
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
        minHeight: height,
      }}
      testID="createOrEditListDialog">
      <DialogInner
        list={list}
        purpose={purpose}
        onSave={onSave}
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
  list,
  purpose,
  onSave,
  setDirty,
  onPressCancel,
}: {
  list?: AppBskyGraphDefs.ListView
  purpose?: AppBskyGraphDefs.ListPurpose
  onSave?: (uri: string) => void
  setDirty: (dirty: boolean) => void
  onPressCancel: () => void
}) {
  const activePurpose = useMemo(() => {
    if (list?.purpose) {
      return list.purpose
    }
    if (purpose) {
      return purpose
    }
    return 'app.bsky.graph.defs#curatelist'
  }, [list, purpose])
  const isCurateList = activePurpose === 'app.bsky.graph.defs#curatelist'

  const {_} = useLingui()
  const t = useTheme()
  const agent = useAgent()
  const control = Dialog.useDialogContext()
  const {
    mutateAsync: createListMutation,
    error: createListError,
    isError: isCreateListError,
    isPending: isCreatingList,
  } = useListCreateMutation()
  const {
    mutateAsync: updateListMutation,
    error: updateListError,
    isError: isUpdateListError,
    isPending: isUpdatingList,
  } = useListMetadataMutation()
  const [imageError, setImageError] = useState('')
  const [displayNameTooShort, setDisplayNameTooShort] = useState(false)
  const initialDisplayName = list?.name || ''
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const initialDescription = list?.description || ''
  const [descriptionRt, setDescriptionRt] = useState<RichTextAPI>(() => {
    const text = list?.description
    const facets = list?.descriptionFacets

    if (!text || !facets) {
      return new RichTextAPI({text: text || ''})
    }

    // We want to be working with a blank state here, so let's get the
    // serialized version and turn it back into a RichText
    const serialized = richTextToString(new RichTextAPI({text, facets}), false)

    const richText = new RichTextAPI({text: serialized})
    richText.detectFacetsWithoutResolution()

    return richText
  })

  const [listAvatar, setListAvatar] = useState<string | undefined | null>(
    list?.avatar,
  )
  const [newListAvatar, setNewListAvatar] = useState<
    ImageMeta | undefined | null
  >()

  const dirty =
    displayName !== initialDisplayName ||
    descriptionRt.text !== initialDescription ||
    listAvatar !== list?.avatar

  useEffect(() => {
    setDirty(dirty)
  }, [dirty, setDirty])

  const onSelectNewAvatar = useCallback(
    (img: ImageMeta | null) => {
      setImageError('')
      if (img === null) {
        setNewListAvatar(null)
        setListAvatar(null)
        return
      }
      try {
        setNewListAvatar(img)
        setListAvatar(img.path)
      } catch (e: any) {
        setImageError(cleanError(e))
      }
    },
    [setNewListAvatar, setListAvatar, setImageError],
  )

  const onPressSave = useCallback(async () => {
    setImageError('')
    setDisplayNameTooShort(false)
    try {
      if (displayName.length === 0) {
        setDisplayNameTooShort(true)
        return
      }

      let richText = new RichTextAPI(
        {text: descriptionRt.text.trimEnd()},
        {cleanNewlines: true},
      )

      await richText.detectFacets(agent)
      richText = shortenLinks(richText)
      richText = stripInvalidMentions(richText)

      if (list) {
        await updateListMutation({
          uri: list.uri,
          name: displayName,
          description: richText.text,
          descriptionFacets: richText.facets,
          avatar: newListAvatar,
        })
        Toast.show(
          isCurateList
            ? _(msg({message: 'User list updated', context: 'toast'}))
            : _(msg({message: 'Moderation list updated', context: 'toast'})),
        )
        control.close(() => onSave?.(list.uri))
      } else {
        const {uri} = await createListMutation({
          purpose: activePurpose,
          name: displayName,
          description: richText.text,
          descriptionFacets: richText.facets,
          avatar: newListAvatar,
        })
        Toast.show(
          isCurateList
            ? _(msg({message: 'User list created', context: 'toast'}))
            : _(msg({message: 'Moderation list created', context: 'toast'})),
        )
        control.close(() => onSave?.(uri))
      }
    } catch (e: any) {
      logger.error('Failed to create/edit list', {message: String(e)})
    }
  }, [
    list,
    createListMutation,
    updateListMutation,
    onSave,
    control,
    displayName,
    descriptionRt,
    newListAvatar,
    setImageError,
    activePurpose,
    isCurateList,
    agent,
    _,
  ])

  const displayNameTooLong = isOverMaxGraphemeCount({
    text: displayName,
    maxCount: DISPLAY_NAME_MAX_GRAPHEMES,
  })
  const descriptionTooLong = isOverMaxGraphemeCount({
    text: descriptionRt,
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
          isCreatingList ||
          isUpdatingList ||
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
        {(isCreatingList || isUpdatingList) && <ButtonIcon icon={Loader} />}
      </Button>
    ),
    [
      _,
      t,
      dirty,
      onPressSave,
      isCreatingList,
      isUpdatingList,
      displayNameTooLong,
      descriptionTooLong,
    ],
  )

  const onChangeDisplayName = useCallback(
    (text: string) => {
      setDisplayName(text)
      if (text.length > 0 && displayNameTooShort) {
        setDisplayNameTooShort(false)
      }
    },
    [displayNameTooShort],
  )

  const onChangeDescription = useCallback(
    (newText: string) => {
      const richText = new RichTextAPI({text: newText})
      richText.detectFacetsWithoutResolution()

      setDescriptionRt(richText)
    },
    [setDescriptionRt],
  )

  const title = list
    ? isCurateList
      ? _(msg`Edit user list`)
      : _(msg`Edit moderation list`)
    : isCurateList
      ? _(msg`Create user list`)
      : _(msg`Create moderation list`)

  const displayNamePlaceholder = isCurateList
    ? _(msg`e.g. Great Posters`)
    : _(msg`e.g. Spammers`)

  const descriptionPlaceholder = isCurateList
    ? _(msg`e.g. The posters who never miss.`)
    : _(msg`e.g. Users that repeatedly reply with ads.`)

  return (
    <Dialog.ScrollableInner
      label={title}
      style={[a.overflow_hidden, web({maxWidth: 500})]}
      contentContainerStyle={[a.px_0, a.pt_0]}
      header={
        <Dialog.Header renderLeft={cancelButton} renderRight={saveButton}>
          <Dialog.HeaderText>{title}</Dialog.HeaderText>
        </Dialog.Header>
      }>
      {isUpdateListError && (
        <ErrorMessage message={cleanError(updateListError)} />
      )}
      {isCreateListError && (
        <ErrorMessage message={cleanError(createListError)} />
      )}
      {imageError !== '' && <ErrorMessage message={imageError} />}
      <View style={[a.pt_xl, a.px_xl, a.gap_xl]}>
        <View>
          <TextField.LabelText>
            <Trans>List avatar</Trans>
          </TextField.LabelText>
          <View style={[a.align_start]}>
            <EditableUserAvatar
              size={80}
              avatar={listAvatar}
              onSelectNewAvatar={onSelectNewAvatar}
              type="list"
            />
          </View>
        </View>
        <View>
          <TextField.LabelText>
            <Trans>List name</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={displayNameTooLong || displayNameTooShort}>
            <Dialog.Input
              defaultValue={displayName}
              onChangeText={onChangeDisplayName}
              label={_(msg`Name`)}
              placeholder={displayNamePlaceholder}
              testID="editListNameInput"
            />
          </TextField.Root>
          {(displayNameTooLong || displayNameTooShort) && (
            <Text
              style={[
                a.text_sm,
                a.mt_xs,
                a.font_bold,
                {color: t.palette.negative_400},
              ]}>
              {displayNameTooLong ? (
                <Trans>
                  List name is too long.{' '}
                  <Plural
                    value={DISPLAY_NAME_MAX_GRAPHEMES}
                    other="The maximum number of characters is #."
                  />
                </Trans>
              ) : displayNameTooShort ? (
                <Trans>List must have a name.</Trans>
              ) : null}
            </Text>
          )}
        </View>

        <View>
          <TextField.LabelText>
            <Trans>List description</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={descriptionTooLong}>
            <Dialog.Input
              defaultValue={descriptionRt.text}
              onChangeText={onChangeDescription}
              multiline
              label={_(msg`Description`)}
              placeholder={descriptionPlaceholder}
              testID="editListDescriptionInput"
            />
          </TextField.Root>
          {descriptionTooLong && (
            <Text
              style={[
                a.text_sm,
                a.mt_xs,
                a.font_bold,
                {color: t.palette.negative_400},
              ]}>
              <Trans>
                List description is too long.{' '}
                <Plural
                  value={DESCRIPTION_MAX_GRAPHEMES}
                  other="The maximum number of characters is #."
                />
              </Trans>
            </Text>
          )}
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
