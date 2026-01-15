import {useCallback, useMemo, useState} from 'react'
import {LayoutAnimation, Text as NestedText, View} from 'react-native'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedPostgate,
  AtUri,
} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useHaptics} from '#/lib/haptics'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {useMyListsQuery} from '#/state/queries/my-lists'
import {useGetPost} from '#/state/queries/post'
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
  type ThreadgateAllowUISetting,
  threadgateViewToAllowUISetting,
  useSetThreadgateAllowMutation,
  useThreadgateViewQuery,
} from '#/state/queries/threadgate'
import {
  PostThreadContextProvider,
  usePostThreadContext,
} from '#/state/queries/usePostThread'
import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon} from '#/components/icons/Quote'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'

export type PostInteractionSettingsFormProps = {
  canSave?: boolean
  onSave: () => void
  isSaving?: boolean

  isDirty?: boolean
  persist?: boolean
  onChangePersist?: (v: boolean) => void

  postgate: AppBskyFeedPostgate.Record
  onChangePostgate: (v: AppBskyFeedPostgate.Record) => void

  threadgateAllowUISettings: ThreadgateAllowUISetting[]
  onChangeThreadgateAllowUISettings: (v: ThreadgateAllowUISetting[]) => void

  replySettingsDisabled?: boolean
}

/**
 * Threadgate settings dialog. Used in the composer.
 */
export function PostInteractionSettingsControlledDialog({
  control,
  ...rest
}: PostInteractionSettingsFormProps & {
  control: Dialog.DialogControlProps
}) {
  const onClose = useNonReactiveCallback(() => {
    logger.metric('composer:threadgate:save', {
      hasChanged: !!rest.isDirty,
      persist: !!rest.persist,
      replyOptions:
        rest.threadgateAllowUISettings?.map(gate => gate.type)?.join(',') ?? '',
      quotesEnabled: !rest.postgate?.embeddingRules?.find(
        v => v.$type === embeddingRules.disableRule.$type,
      ),
    })
  })

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{
        preventExpansion: true,
        preventDismiss: rest.isDirty && rest.persist,
      }}
      onClose={onClose}>
      <Dialog.Handle />
      <DialogInner {...rest} />
    </Dialog.Outer>
  )
}

function DialogInner(props: Omit<PostInteractionSettingsFormProps, 'control'>) {
  const {_} = useLingui()

  return (
    <Dialog.ScrollableInner
      label={_(msg`Edit post interaction settings`)}
      style={[web({maxWidth: 400}), a.w_full]}>
      <Header />
      <PostInteractionSettingsForm {...props} />
      <Dialog.Close />
    </Dialog.ScrollableInner>
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

/**
 * Threadgate settings dialog. Used in the thread.
 */
export function PostInteractionSettingsDialog(
  props: PostInteractionSettingsDialogProps,
) {
  const postThreadContext = usePostThreadContext()
  return (
    <Dialog.Outer
      control={props.control}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <PostThreadContextProvider context={postThreadContext}>
        <PostInteractionSettingsDialogControlledInner {...props} />
      </PostThreadContextProvider>
    </Dialog.Outer>
  )
}

export function PostInteractionSettingsDialogControlledInner(
  props: PostInteractionSettingsDialogProps,
) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const [isSaving, setIsSaving] = useState(false)

  const {data: threadgateViewLoaded, isLoading: isLoadingThreadgate} =
    useThreadgateViewQuery({postUri: props.rootPostUri})
  const {data: postgate, isLoading: isLoadingPostgate} = usePostgateQuery({
    postUri: props.postUri,
  })

  const {mutateAsync: writePostgateRecord} = useWritePostgateMutation()
  const {mutateAsync: setThreadgateAllow} = useSetThreadgateAllowMutation()

  const [editedPostgate, setEditedPostgate] =
    useState<AppBskyFeedPostgate.Record>()
  const [editedAllowUISettings, setEditedAllowUISettings] =
    useState<ThreadgateAllowUISetting[]>()

  const isLoading = isLoadingThreadgate || isLoadingPostgate
  const threadgateView = threadgateViewLoaded || props.initialThreadgateView
  const isThreadgateOwnedByViewer = useMemo(() => {
    return currentAccount?.did === new AtUri(props.rootPostUri).host
  }, [props.rootPostUri, currentAccount?.did])

  const postgateValue = useMemo(() => {
    return (
      editedPostgate || postgate || createPostgateRecord({post: props.postUri})
    )
  }, [postgate, editedPostgate, props.postUri])
  const allowUIValue = useMemo(() => {
    return (
      editedAllowUISettings || threadgateViewToAllowUISetting(threadgateView)
    )
  }, [threadgateView, editedAllowUISettings])

  const onSave = useCallback(async () => {
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
        source: 'PostInteractionSettingsDialogControlledInner',
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
      style={[web({maxWidth: 400}), a.w_full]}>
      {isLoading ? (
        <View
          style={[
            a.flex_1,
            a.py_5xl,
            a.gap_md,
            a.align_center,
            a.justify_center,
          ]}>
          <Loader size="xl" />
          <Text style={[a.italic, a.text_center]}>
            <Trans>Loading post interaction settings...</Trans>
          </Text>
        </View>
      ) : (
        <>
          <Header />
          <PostInteractionSettingsForm
            replySettingsDisabled={!isThreadgateOwnedByViewer}
            isSaving={isSaving}
            onSave={onSave}
            postgate={postgateValue}
            onChangePostgate={setEditedPostgate}
            threadgateAllowUISettings={allowUIValue}
            onChangeThreadgateAllowUISettings={setEditedAllowUISettings}
          />
        </>
      )}
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

export function PostInteractionSettingsForm({
  canSave = true,
  onSave,
  isSaving,
  postgate,
  onChangePostgate,
  threadgateAllowUISettings,
  onChangeThreadgateAllowUISettings,
  replySettingsDisabled,
  isDirty,
  persist,
  onChangePersist,
}: PostInteractionSettingsFormProps) {
  const t = useTheme()
  const {_} = useLingui()
  const playHaptic = useHaptics()
  const [showLists, setShowLists] = useState(false)
  const {
    data: lists,
    isPending: isListsPending,
    isError: isListsError,
  } = useMyListsQuery('curate')
  const [quotesEnabled, setQuotesEnabled] = useState(
    !(
      postgate.embeddingRules &&
      postgate.embeddingRules.find(
        v => v.$type === embeddingRules.disableRule.$type,
      )
    ),
  )

  const onChangeQuotesEnabled = useCallback(
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
  const everyoneCanReply = !!threadgateAllowUISettings.find(
    v => v.type === 'everybody',
  )
  const numberOfListsSelected = threadgateAllowUISettings.filter(
    v => v.type === 'list',
  ).length

  const toggleGroupValues = useMemo(() => {
    const values: string[] = []
    for (const setting of threadgateAllowUISettings) {
      switch (setting.type) {
        case 'everybody':
        case 'nobody':
          // no granularity, early return with nothing
          return []
        case 'followers':
          values.push('followers')
          break
        case 'following':
          values.push('following')
          break
        case 'mention':
          values.push('mention')
          break
        case 'list':
          values.push(`list:${setting.list}`)
          break
        default:
          break
      }
    }
    return values
  }, [threadgateAllowUISettings])

  const toggleGroupOnChange = (values: string[]) => {
    const settings: ThreadgateAllowUISetting[] = []

    if (values.length === 0) {
      settings.push({type: 'everybody'})
    } else {
      for (const value of values) {
        if (value.startsWith('list:')) {
          const listId = value.slice('list:'.length)
          settings.push({type: 'list', list: listId})
        } else {
          settings.push({type: value as 'followers' | 'following' | 'mention'})
        }
      }
    }

    onChangeThreadgateAllowUISettings(settings)
  }

  return (
    <View style={[a.flex_1, a.gap_lg]}>
      <View style={[a.gap_lg]}>
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
              style={[a.flex_1, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>
                Reply settings are chosen by the author of the thread
              </Trans>
            </Text>
          </View>
        )}

        <View style={[a.gap_sm, {opacity: replySettingsDisabled ? 0.3 : 1}]}>
          <Text style={[a.text_md, a.font_medium]}>
            <Trans>Who can reply</Trans>
          </Text>

          <Toggle.Group
            label={_(msg`Set who can reply to your post`)}
            type="radio"
            maxSelections={1}
            disabled={replySettingsDisabled}
            values={
              everyoneCanReply ? ['everyone'] : noOneCanReply ? ['nobody'] : []
            }
            onChange={val => {
              if (val.includes('everyone')) {
                onChangeThreadgateAllowUISettings([{type: 'everybody'}])
              } else if (val.includes('nobody')) {
                onChangeThreadgateAllowUISettings([{type: 'nobody'}])
              } else {
                onChangeThreadgateAllowUISettings([{type: 'mention'}])
              }
            }}>
            <View style={[a.flex_row, a.gap_sm]}>
              <Toggle.Item
                name="everyone"
                type="checkbox"
                label={_(msg`Allow anyone to reply`)}
                style={[a.flex_1]}>
                {({selected}) => (
                  <Toggle.Panel active={selected}>
                    <Toggle.Radio />
                    <Toggle.PanelText>
                      <Trans>Anyone</Trans>
                    </Toggle.PanelText>
                  </Toggle.Panel>
                )}
              </Toggle.Item>
              <Toggle.Item
                name="nobody"
                type="checkbox"
                label={_(msg`Disable replies entirely`)}
                style={[a.flex_1]}>
                {({selected}) => (
                  <Toggle.Panel active={selected}>
                    <Toggle.Radio />
                    <Toggle.PanelText>
                      <Trans>Nobody</Trans>
                    </Toggle.PanelText>
                  </Toggle.Panel>
                )}
              </Toggle.Item>
            </View>
          </Toggle.Group>

          <Toggle.Group
            label={_(
              msg`Set precisely which groups of people can reply to your post`,
            )}
            values={toggleGroupValues}
            onChange={toggleGroupOnChange}
            disabled={replySettingsDisabled}>
            <Toggle.PanelGroup>
              <Toggle.Item
                name="followers"
                type="checkbox"
                label={_(msg`Allow your followers to reply`)}
                hitSlop={0}>
                {({selected}) => (
                  <Toggle.Panel active={selected} adjacent="trailing">
                    <Toggle.Checkbox />
                    <Toggle.PanelText>
                      <Trans>Your followers</Trans>
                    </Toggle.PanelText>
                  </Toggle.Panel>
                )}
              </Toggle.Item>
              <Toggle.Item
                name="following"
                type="checkbox"
                label={_(msg`Allow people you follow to reply`)}
                hitSlop={0}>
                {({selected}) => (
                  <Toggle.Panel active={selected} adjacent="both">
                    <Toggle.Checkbox />
                    <Toggle.PanelText>
                      <Trans>People you follow</Trans>
                    </Toggle.PanelText>
                  </Toggle.Panel>
                )}
              </Toggle.Item>
              <Toggle.Item
                name="mention"
                type="checkbox"
                label={_(msg`Allow people you mention to reply`)}
                hitSlop={0}>
                {({selected}) => (
                  <Toggle.Panel active={selected} adjacent="both">
                    <Toggle.Checkbox />
                    <Toggle.PanelText>
                      <Trans>People you mention</Trans>
                    </Toggle.PanelText>
                  </Toggle.Panel>
                )}
              </Toggle.Item>

              <Button
                label={
                  showLists
                    ? _(msg`Hide lists`)
                    : _(msg`Show lists of users to select from`)
                }
                accessibilityRole="togglebutton"
                hitSlop={0}
                onPress={() => {
                  playHaptic('Light')
                  if (IS_IOS && !showLists) {
                    LayoutAnimation.configureNext({
                      ...LayoutAnimation.Presets.linear,
                      duration: 175,
                    })
                  }
                  setShowLists(s => !s)
                }}>
                <Toggle.Panel
                  active={numberOfListsSelected > 0}
                  adjacent={showLists ? 'both' : 'leading'}>
                  <Toggle.PanelText>
                    {numberOfListsSelected === 0 ? (
                      <Trans>Select from your lists</Trans>
                    ) : (
                      <Trans>
                        Select from your lists{' '}
                        <NestedText style={[a.font_normal, a.italic]}>
                          <Plural
                            value={numberOfListsSelected}
                            other="(# selected)"
                          />
                        </NestedText>
                      </Trans>
                    )}
                  </Toggle.PanelText>
                  <Toggle.PanelIcon
                    icon={showLists ? ChevronUpIcon : ChevronDownIcon}
                  />
                </Toggle.Panel>
              </Button>
              {showLists &&
                (isListsPending ? (
                  <Toggle.Panel>
                    <Toggle.PanelText>
                      <Trans>Loading lists...</Trans>
                    </Toggle.PanelText>
                  </Toggle.Panel>
                ) : isListsError ? (
                  <Toggle.Panel>
                    <Toggle.PanelText>
                      <Trans>
                        An error occurred while loading your lists :/
                      </Trans>
                    </Toggle.PanelText>
                  </Toggle.Panel>
                ) : lists.length === 0 ? (
                  <Toggle.Panel>
                    <Toggle.PanelText>
                      <Trans>You don't have any lists yet.</Trans>
                    </Toggle.PanelText>
                  </Toggle.Panel>
                ) : (
                  lists.map((list, i) => (
                    <Toggle.Item
                      key={list.uri}
                      name={`list:${list.uri}`}
                      type="checkbox"
                      label={_(msg`Allow users in ${list.name} to reply`)}
                      hitSlop={0}>
                      {({selected}) => (
                        <Toggle.Panel
                          active={selected}
                          adjacent={
                            i === lists.length - 1 ? 'leading' : 'both'
                          }>
                          <Toggle.Checkbox />
                          <UserAvatar
                            size={24}
                            type="list"
                            avatar={list.avatar}
                          />
                          <Toggle.PanelText>{list.name}</Toggle.PanelText>
                        </Toggle.Panel>
                      )}
                    </Toggle.Item>
                  ))
                ))}
            </Toggle.PanelGroup>
          </Toggle.Group>
        </View>
      </View>

      <Toggle.Item
        name="quoteposts"
        type="checkbox"
        label={
          quotesEnabled
            ? _(msg`Disable quote posts of this post`)
            : _(msg`Enable quote posts of this post`)
        }
        value={quotesEnabled}
        onChange={onChangeQuotesEnabled}>
        {({selected}) => (
          <Toggle.Panel active={selected}>
            <Toggle.PanelText icon={QuoteIcon}>
              <Trans>Allow quote posts</Trans>
            </Toggle.PanelText>
            <Toggle.Switch />
          </Toggle.Panel>
        )}
      </Toggle.Item>

      {typeof persist !== 'undefined' && (
        <View style={[{minHeight: 24}, a.justify_center]}>
          {isDirty ? (
            <Toggle.Item
              name="persist"
              type="checkbox"
              label={_(msg`Save these options for next time`)}
              value={persist}
              onChange={() => onChangePersist?.(!persist)}>
              <Toggle.Checkbox />
              <Toggle.LabelText
                style={[a.text_md, a.font_normal, t.atoms.text]}>
                <Trans>Save these options for next time</Trans>
              </Toggle.LabelText>
            </Toggle.Item>
          ) : (
            <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
              <Trans>These are your default settings</Trans>
            </Text>
          )}
        </View>
      )}

      <Button
        disabled={!canSave || isSaving}
        label={_(msg`Save`)}
        onPress={onSave}
        color="primary"
        size="large">
        <ButtonText>
          <Trans>Save</Trans>
        </ButtonText>
        {isSaving && <ButtonIcon icon={Loader} />}
      </Button>
    </View>
  )
}

function Header() {
  return (
    <View style={[a.pb_lg]}>
      <Text style={[a.text_2xl, a.font_bold]}>
        <Trans>Post interaction settings</Trans>
      </Text>
    </View>
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
  const getPost = useGetPost()

  return useCallback(async () => {
    try {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: createPostgateQueryKey(postUri),
          queryFn: () =>
            getPostgateRecord({agent, postUri}).then(res => res ?? null),
          staleTime: STALE.SECONDS.THIRTY,
        }),
        queryClient.prefetchQuery({
          queryKey: createThreadgateViewQueryKey(rootPostUri),
          queryFn: async () => {
            const post = await getPost({uri: rootPostUri})
            return post.threadgate ?? null
          },
          staleTime: STALE.SECONDS.THIRTY,
        }),
      ])
    } catch (e: any) {
      logger.error(`Failed to prefetch post interaction settings`, {
        safeMessage: e.message,
      })
    }
  }, [queryClient, agent, postUri, rootPostUri, getPost])
}
