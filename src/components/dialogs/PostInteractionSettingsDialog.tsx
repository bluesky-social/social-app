import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {AppBskyFeedDefs, AppBskyFeedPostgate, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'
import isEqual from 'lodash.isequal'

import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {useMyListsQuery} from '#/state/queries/my-lists'
import {
  createPostgateQueryKey,
  getPostgateRecord,
  usePostgateQuery,
  useWritePostgateMutation,
} from '#/state/queries/postgate'
import {
  createPostgateRecord,
  embeddingRules,
} from '#/state/queries/postgate/util'
import {
  createThreadgateViewQueryKey,
  getThreadgateView,
  ThreadgateAllowUISetting,
  threadgateViewToAllowUISetting,
  useSetThreadgateAllowMutation,
  useThreadgateViewQuery,
} from '#/state/queries/threadgate'
import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export type PostInteractionSettingsFormProps = {
  onSave: () => void
  isSaving?: boolean

  postgate: AppBskyFeedPostgate.Record
  onChangePostgate: (v: AppBskyFeedPostgate.Record) => void

  threadgateAllowUISettings: ThreadgateAllowUISetting[]
  onChangeThreadgateAllowUISettings: (v: ThreadgateAllowUISetting[]) => void

  replySettingsDisabled?: boolean
}

export function PostInteractionSettingsControlledDialog({
  control,
  ...rest
}: PostInteractionSettingsFormProps & {
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Edit post interaction settings`)}
        style={[{maxWidth: 500}, a.w_full]}>
        <PostInteractionSettingsForm {...rest} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

export type PostInteractionSettingsDialogProps = {
  control: Dialog.DialogControlProps
  /**
   * URI of the post to edit the interaction settings for. Could be a root post
   * or could be a reply.
   */
  postUri: string
  /**
   * The URI of the root post in the thread. Used to determine if the viewer
   * owns the threadgate record and can therefore edit it.
   */
  rootPostUri: string
  /**
   * Optional initial {@link AppBskyFeedDefs.ThreadgateView} to use if we
   * happen to have one before opening the settings dialog.
   */
  initialThreadgateView?: AppBskyFeedDefs.ThreadgateView
}

export function PostInteractionSettingsDialog(
  props: PostInteractionSettingsDialogProps,
) {
  return (
    <Dialog.Outer control={props.control}>
      <Dialog.Handle />
      <PostInteractionSettingsDialogControlledInner {...props} />
    </Dialog.Outer>
  )
}

export function PostInteractionSettingsDialogControlledInner(
  props: PostInteractionSettingsDialogProps,
) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const [isSaving, setIsSaving] = React.useState(false)

  const {data: threadgateViewLoaded, isLoading: isLoadingThreadgate} =
    useThreadgateViewQuery({postUri: props.rootPostUri})
  const {data: postgate, isLoading: isLoadingPostgate} = usePostgateQuery({
    postUri: props.postUri,
  })

  const {mutateAsync: writePostgateRecord} = useWritePostgateMutation()
  const {mutateAsync: setThreadgateAllow} = useSetThreadgateAllowMutation()

  const [editedPostgate, setEditedPostgate] =
    React.useState<AppBskyFeedPostgate.Record>()
  const [editedAllowUISettings, setEditedAllowUISettings] =
    React.useState<ThreadgateAllowUISetting[]>()

  const isLoading = isLoadingThreadgate || isLoadingPostgate
  const threadgateView = threadgateViewLoaded || props.initialThreadgateView
  const isThreadgateOwnedByViewer = React.useMemo(() => {
    return currentAccount?.did === new AtUri(props.rootPostUri).host
  }, [props.rootPostUri, currentAccount?.did])

  const postgateValue = React.useMemo(() => {
    return (
      editedPostgate || postgate || createPostgateRecord({post: props.postUri})
    )
  }, [postgate, editedPostgate, props.postUri])
  const allowUIValue = React.useMemo(() => {
    return (
      editedAllowUISettings || threadgateViewToAllowUISetting(threadgateView)
    )
  }, [threadgateView, editedAllowUISettings])

  const onSave = React.useCallback(async () => {
    if (!editedPostgate && !editedAllowUISettings) {
      props.control.close()
      return
    }

    setIsSaving(true)

    try {
      const requests = []

      if (editedPostgate) {
        requests.push(
          writePostgateRecord({
            postUri: props.postUri,
            postgate: editedPostgate,
          }),
        )
      }

      if (editedAllowUISettings && isThreadgateOwnedByViewer) {
        requests.push(
          setThreadgateAllow({
            postUri: props.rootPostUri,
            allow: editedAllowUISettings,
          }),
        )
      }

      await Promise.all(requests)

      props.control.close()
    } catch (e: any) {
      logger.error(`Failed to save post interaction settings`, {
        context: 'PostInteractionSettingsDialogControlledInner',
        safeMessage: e.message,
      })
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
        'xmark',
      )
    } finally {
      setIsSaving(false)
    }
  }, [
    _,
    props.postUri,
    props.rootPostUri,
    props.control,
    editedPostgate,
    editedAllowUISettings,
    setIsSaving,
    writePostgateRecord,
    setThreadgateAllow,
    isThreadgateOwnedByViewer,
  ])

  return (
    <Dialog.ScrollableInner
      label={_(msg`Edit post interaction settings`)}
      style={[{maxWidth: 500}, a.w_full]}>
      {isLoading ? (
        <View style={[a.flex_1, a.py_4xl, a.align_center, a.justify_center]}>
          <Loader size="xl" />
        </View>
      ) : (
        <PostInteractionSettingsForm
          replySettingsDisabled={!isThreadgateOwnedByViewer}
          isSaving={isSaving}
          onSave={onSave}
          postgate={postgateValue}
          onChangePostgate={setEditedPostgate}
          threadgateAllowUISettings={allowUIValue}
          onChangeThreadgateAllowUISettings={setEditedAllowUISettings}
        />
      )}
    </Dialog.ScrollableInner>
  )
}

export function PostInteractionSettingsForm({
  onSave,
  isSaving,
  postgate,
  onChangePostgate,
  threadgateAllowUISettings,
  onChangeThreadgateAllowUISettings,
  replySettingsDisabled,
}: PostInteractionSettingsFormProps) {
  const t = useTheme()
  const {_} = useLingui()
  const {data: lists} = useMyListsQuery('curate')
  const [quotesEnabled, setQuotesEnabled] = React.useState(
    !(
      postgate.embeddingRules &&
      postgate.embeddingRules.find(
        v => v.$type === embeddingRules.disableRule.$type,
      )
    ),
  )

  const onPressAudience = (setting: ThreadgateAllowUISetting) => {
    // remove boolean values
    let newSelected: ThreadgateAllowUISetting[] =
      threadgateAllowUISettings.filter(
        v => v.type !== 'nobody' && v.type !== 'everybody',
      )
    // toggle
    const i = newSelected.findIndex(v => isEqual(v, setting))
    if (i === -1) {
      newSelected.push(setting)
    } else {
      newSelected.splice(i, 1)
    }
    if (newSelected.length === 0) {
      newSelected.push({type: 'everybody'})
    }

    onChangeThreadgateAllowUISettings(newSelected)
  }

  const onChangeQuotesEnabled = React.useCallback(
    (enabled: boolean) => {
      setQuotesEnabled(enabled)
      onChangePostgate(
        createPostgateRecord({
          ...postgate,
          embeddingRules: enabled ? [] : [embeddingRules.disableRule],
        }),
      )
    },
    [setQuotesEnabled, postgate, onChangePostgate],
  )

  const noOneCanReply = !!threadgateAllowUISettings.find(
    v => v.type === 'nobody',
  )

  return (
    <View>
      <View style={[a.flex_1, a.gap_md]}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>Post interaction settings</Trans>
        </Text>

        <View style={[a.gap_lg]}>
          <Text style={[a.text_md]}>
            <Trans>Customize who can interact with this post.</Trans>
          </Text>

          <Divider />

          <View style={[a.gap_sm]}>
            <Text style={[a.font_bold, a.text_lg]}>
              <Trans>Quote settings</Trans>
            </Text>

            <Toggle.Item
              name="quoteposts"
              type="checkbox"
              label={
                quotesEnabled
                  ? _(msg`Click to disable quote posts of this post.`)
                  : _(msg`Click to enable quote posts of this post.`)
              }
              value={quotesEnabled}
              onChange={onChangeQuotesEnabled}
              style={[a.justify_between, a.pt_xs]}>
              <Text style={[t.atoms.text_contrast_medium]}>
                <Trans>Allow quote posts</Trans>
              </Text>
              <Toggle.Switch />
            </Toggle.Item>
          </View>

          <Divider />

          {replySettingsDisabled && (
            <View
              style={[
                a.px_md,
                a.py_sm,
                a.rounded_sm,
                a.flex_row,
                a.align_center,
                a.gap_sm,
                t.atoms.bg_contrast_25,
              ]}>
              <CircleInfo fill={t.atoms.text_contrast_low.color} />
              <Text
                style={[
                  a.flex_1,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Reply settings are chosen by the author of the thread
                </Trans>
              </Text>
            </View>
          )}

          <View
            style={[
              a.gap_sm,
              {
                opacity: replySettingsDisabled ? 0.3 : 1,
              },
            ]}>
            <Text style={[a.font_bold, a.text_lg]}>
              <Trans>Reply settings</Trans>
            </Text>

            <Text style={[a.pt_sm, t.atoms.text_contrast_medium]}>
              <Trans>Allow replies from:</Trans>
            </Text>

            <View style={[a.flex_row, a.gap_sm]}>
              <Selectable
                label={_(msg`Everybody`)}
                isSelected={
                  !!threadgateAllowUISettings.find(v => v.type === 'everybody')
                }
                onPress={() =>
                  onChangeThreadgateAllowUISettings([{type: 'everybody'}])
                }
                style={{flex: 1}}
                disabled={replySettingsDisabled}
              />
              <Selectable
                label={_(msg`Nobody`)}
                isSelected={noOneCanReply}
                onPress={() =>
                  onChangeThreadgateAllowUISettings([{type: 'nobody'}])
                }
                style={{flex: 1}}
                disabled={replySettingsDisabled}
              />
            </View>

            {!noOneCanReply && (
              <>
                <Text style={[a.pt_sm, t.atoms.text_contrast_medium]}>
                  <Trans>Or combine these options:</Trans>
                </Text>

                <View style={[a.gap_sm]}>
                  <Selectable
                    label={_(msg`Mentioned users`)}
                    isSelected={
                      !!threadgateAllowUISettings.find(
                        v => v.type === 'mention',
                      )
                    }
                    onPress={() => onPressAudience({type: 'mention'})}
                    disabled={replySettingsDisabled}
                  />
                  <Selectable
                    label={_(msg`Followed users`)}
                    isSelected={
                      !!threadgateAllowUISettings.find(
                        v => v.type === 'following',
                      )
                    }
                    onPress={() => onPressAudience({type: 'following'})}
                    disabled={replySettingsDisabled}
                  />
                  {lists && lists.length > 0
                    ? lists.map(list => (
                        <Selectable
                          key={list.uri}
                          label={_(msg`Users in "${list.name}"`)}
                          isSelected={
                            !!threadgateAllowUISettings.find(
                              v => v.type === 'list' && v.list === list.uri,
                            )
                          }
                          onPress={() =>
                            onPressAudience({type: 'list', list: list.uri})
                          }
                          disabled={replySettingsDisabled}
                        />
                      ))
                    : // No loading states to avoid jumps for the common case (no lists)
                      null}
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      <Button
        label={_(msg`Save`)}
        onPress={onSave}
        color="primary"
        size="large"
        variant="solid"
        style={a.mt_xl}>
        <ButtonText>{_(msg`Save`)}</ButtonText>
        {isSaving && <ButtonIcon icon={Loader} position="right" />}
      </Button>
    </View>
  )
}

function Selectable({
  label,
  isSelected,
  onPress,
  style,
  disabled,
}: {
  label: string
  isSelected: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
  disabled?: boolean
}) {
  const t = useTheme()
  return (
    <Button
      disabled={disabled}
      onPress={onPress}
      label={label}
      accessibilityRole="checkbox"
      aria-checked={isSelected}
      accessibilityState={{
        checked: isSelected,
      }}
      style={a.flex_1}>
      {({hovered, focused}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.rounded_sm,
            a.p_md,
            {minHeight: 40}, // for consistency with checkmark icon visible or not
            t.atoms.bg_contrast_50,
            (hovered || focused) && t.atoms.bg_contrast_100,
            isSelected && {
              backgroundColor: t.palette.primary_100,
            },
            style,
          ]}>
          <Text style={[a.text_sm, isSelected && a.font_bold]}>{label}</Text>
          {isSelected ? (
            <Check size="sm" fill={t.palette.primary_500} />
          ) : (
            <View />
          )}
        </View>
      )}
    </Button>
  )
}

export function usePrefetchPostInteractionSettings({
  postUri,
  rootPostUri,
}: {
  postUri: string
  rootPostUri: string
}) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return React.useCallback(async () => {
    try {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: createPostgateQueryKey(postUri),
          queryFn: () => getPostgateRecord({agent, postUri}),
          staleTime: STALE.SECONDS.THIRTY,
        }),
        queryClient.prefetchQuery({
          queryKey: createThreadgateViewQueryKey(rootPostUri),
          queryFn: () => getThreadgateView({agent, postUri: rootPostUri}),
          staleTime: STALE.SECONDS.THIRTY,
        }),
      ])
    } catch (e: any) {
      logger.error(`Failed to prefetch post interaction settings`, {
        safeMessage: e.message,
      })
    }
  }, [queryClient, agent, postUri, rootPostUri])
}
