import React from 'react'
import {Keyboard, StyleProp, View, ViewStyle} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
  AppBskyFeedPostgate,
  AppBskyGraphDefs,
  AtUri,
  BskyAgent,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {HITSLOP_10} from '#/lib/constants'
import {makeListLink, makeProfileLink} from '#/lib/routes/links'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {RQKEY_ROOT as POST_THREAD_RQKEY_ROOT} from '#/state/queries/post-thread'
import {useWritePostgateMutation} from '#/state/queries/postgate'
import {embeddingRules} from '#/state/queries/postgate/util'
import {
  ThreadgateAllowUISetting,
  threadgateRecordQueryKeyRoot,
  threadgateViewToAllowUISetting,
  updateThreadgateAllow,
} from '#/state/queries/threadgate'
import {useAgent} from '#/state/session'
import * as Toast from 'view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {Earth_Stroke2_Corner0_Rounded as Earth} from '#/components/icons/Globe'
import {Group3_Stroke2_Corner0_Rounded as Group} from '#/components/icons/Group'
import {Text} from '#/components/Typography'
import {TextLink} from '../view/com/util/Link'
import {ThreadgateEditorDialog} from './dialogs/ThreadgateEditor'
import {PencilLine_Stroke2_Corner0_Rounded as PencilLine} from './icons/Pencil'

interface WhoCanReplyProps {
  post: AppBskyFeedDefs.PostView
  isThreadAuthor: boolean
  style?: StyleProp<ViewStyle>
  postgate: AppBskyFeedPostgate.Record
}

export function WhoCanReply({
  post,
  isThreadAuthor,
  style,
  postgate: initialPostgate,
}: WhoCanReplyProps) {
  const {_} = useLingui()
  const t = useTheme()
  const infoDialogControl = useDialogControl()
  const editDialogControl = useDialogControl()
  const agent = useAgent()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = React.useState(false)
  const {mutateAsync: writePostgateRecord} = useWritePostgateMutation()

  const [postgate, setPostgate] = React.useState(initialPostgate)
  // TODO test if we get weird data back
  const [settings, setSettings] = React.useState(
    threadgateViewToAllowUISetting(post.threadgate),
  )

  const anyoneCanReply =
    settings.length === 1 && settings[0].type === 'everybody'
  const noOneCanReply = settings.length === 1 && settings[0].type === 'nobody'
  const anyoneCanQuote =
    !postgate.quotepostRules || postgate.quotepostRules.length === 0
  const noOneCanQuote =
    postgate.quotepostRules?.length === 1 &&
    postgate.quotepostRules[0]?.$type === embeddingRules.disableRule.$type
  const anyoneCanInteract = anyoneCanReply && anyoneCanQuote
  const noOneCanInteract = noOneCanReply && noOneCanQuote
  const description = anyoneCanInteract
    ? _(msg`Anybody can interact`)
    : noOneCanInteract
    ? _(msg`Nobody can interact`)
    : _(msg`Interaction limited`)

  const onPressOpen = () => {
    if (isNative && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }
    if (isThreadAuthor) {
      editDialogControl.open()
    } else {
      infoDialogControl.open()
    }
  }

  const onChangePostgate = React.useCallback(
    (next: AppBskyFeedPostgate.Record) => {
      setPostgate(next)
    },
    [setPostgate],
  )

  const onChangeThreadgateAllowUISettings = React.useCallback(
    (next: ThreadgateAllowUISetting[]) => {
      setSettings(next)
    },
    [setSettings],
  )

  const saveThreadgateAllowSettings = React.useCallback(async () => {
    try {
      await updateThreadgateAllow({
        agent,
        postUri: post.uri,
        allow: settings,
      })

      await whenAppViewReady(agent, post.uri, res => {
        const thread = res.data.thread
        if (AppBskyFeedDefs.isThreadViewPost(thread)) {
          const fetchedSettings = threadgateViewToAllowUISetting(
            thread.post.threadgate,
          )
          return JSON.stringify(fetchedSettings) === JSON.stringify(settings)
        }
        return false
      })

      queryClient.invalidateQueries({
        queryKey: [POST_THREAD_RQKEY_ROOT],
      })
      queryClient.invalidateQueries({
        queryKey: [threadgateRecordQueryKeyRoot],
      })
    } catch (e: any) {
      logger.error('Failed to edit threadgate', {safeMessage: e.message})
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
        'xmark',
      )
    }
  }, [_, agent, post, settings, queryClient])

  const savePostgateRecord = React.useCallback(async () => {
    try {
      await writePostgateRecord({postUri: post.uri, postgate})
    } catch (e: any) {
      logger.error('Failed to save postgate', {safeMessage: e.message})
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
        'xmark',
      )
    }
  }, [_, post, postgate, writePostgateRecord])

  const onSave = React.useCallback(async () => {
    setIsSaving(true)

    try {
      await Promise.all([saveThreadgateAllowSettings(), savePostgateRecord()])
      editDialogControl.close()
      Toast.show(_(msg`Thread settings updated`))
    } catch (e: any) {
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
    editDialogControl,
    saveThreadgateAllowSettings,
    savePostgateRecord,
    setIsSaving,
  ])

  return (
    <>
      <Button
        label={
          isThreadAuthor ? _(msg`Edit who can reply`) : _(msg`Who can reply`)
        }
        onPress={onPressOpen}
        hitSlop={HITSLOP_10}>
        {({hovered}) => (
          <View style={[a.flex_row, a.align_center, a.gap_xs, style]}>
            <Icon
              color={t.palette.contrast_400}
              width={16}
              settings={settings}
            />
            <Text
              style={[
                a.text_sm,
                a.leading_tight,
                t.atoms.text_contrast_medium,
                hovered && a.underline,
              ]}>
              {description}
            </Text>

            {isThreadAuthor && (
              <PencilLine width={12} fill={t.palette.primary_500} />
            )}
          </View>
        )}
      </Button>

      {isThreadAuthor ? (
        <ThreadgateEditorDialog
          onSave={onSave}
          isSaving={isSaving}
          postgate={postgate}
          onChangePostgate={onChangePostgate}
          threadgateAllowUISettings={settings}
          onChangeThreadgateAllowUISettings={onChangeThreadgateAllowUISettings}
          control={editDialogControl}
        />
      ) : (
        <WhoCanReplyDialog
          control={infoDialogControl}
          post={post}
          settings={settings}
        />
      )}
    </>
  )
}

function Icon({
  color,
  width,
  settings,
}: {
  color: string
  width?: number
  settings: ThreadgateAllowUISetting[]
}) {
  const isEverybody = settings.length === 0
  const isNobody = !!settings.find(gate => gate.type === 'nobody')
  const IconComponent = isEverybody ? Earth : isNobody ? CircleBanSign : Group
  return <IconComponent fill={color} width={width} />
}

function WhoCanReplyDialog({
  control,
  post,
  settings,
}: {
  control: Dialog.DialogControlProps
  post: AppBskyFeedDefs.PostView
  settings: ThreadgateAllowUISetting[]
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <WhoCanReplyDialogInner post={post} settings={settings} />
    </Dialog.Outer>
  )
}

function WhoCanReplyDialogInner({
  post,
  settings,
}: {
  post: AppBskyFeedDefs.PostView
  settings: ThreadgateAllowUISetting[]
}) {
  const {_} = useLingui()
  return (
    <Dialog.ScrollableInner
      label={_(msg`Who can reply dialog`)}
      style={[{width: 'auto', maxWidth: 400, minWidth: 200}]}>
      <View style={[a.gap_sm]}>
        <Text style={[a.font_bold, a.text_xl]}>
          <Trans>Who can reply?</Trans>
        </Text>
        <Rules post={post} settings={settings} />
      </View>
    </Dialog.ScrollableInner>
  )
}

function Rules({
  post,
  settings,
}: {
  post: AppBskyFeedDefs.PostView
  settings: ThreadgateAllowUISetting[]
}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.text_md,
        a.leading_tight,
        a.flex_wrap,
        t.atoms.text_contrast_medium,
      ]}>
      {!settings.length ? (
        <Trans>Everybody can reply</Trans>
      ) : settings[0].type === 'nobody' ? (
        <Trans>Replies to this thread are disabled</Trans>
      ) : (
        <Trans>
          Only{' '}
          {settings.map((rule, i) => (
            <>
              <Rule
                key={`rule-${i}`}
                rule={rule}
                post={post}
                lists={post.threadgate!.lists}
              />
              <Separator key={`sep-${i}`} i={i} length={settings.length} />
            </>
          ))}{' '}
          can reply
        </Trans>
      )}
    </Text>
  )
}

function Rule({
  rule,
  post,
  lists,
}: {
  rule: ThreadgateAllowUISetting
  post: AppBskyFeedDefs.PostView
  lists: AppBskyGraphDefs.ListViewBasic[] | undefined
}) {
  const t = useTheme()
  if (rule.type === 'mention') {
    return <Trans>mentioned users</Trans>
  }
  if (rule.type === 'following') {
    return (
      <Trans>
        users followed by{' '}
        <TextLink
          type="sm"
          href={makeProfileLink(post.author)}
          text={`@${post.author.handle}`}
          style={{color: t.palette.primary_500}}
        />
      </Trans>
    )
  }
  if (rule.type === 'list') {
    const list = lists?.find(l => l.uri === rule.list)
    if (list) {
      const listUrip = new AtUri(list.uri)
      return (
        <Trans>
          <TextLink
            type="sm"
            href={makeListLink(listUrip.hostname, listUrip.rkey)}
            text={list.name}
            style={{color: t.palette.primary_500}}
          />{' '}
          members
        </Trans>
      )
    }
  }
}

function Separator({i, length}: {i: number; length: number}) {
  if (length < 2 || i === length - 1) {
    return null
  }
  if (i === length - 2) {
    return (
      <>
        {length > 2 ? ',' : ''} <Trans>and</Trans>{' '}
      </>
    )
  }
  return <>, </>
}

async function whenAppViewReady(
  agent: BskyAgent,
  uri: string,
  fn: (res: AppBskyFeedGetPostThread.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      agent.app.bsky.feed.getPostThread({
        uri,
        depth: 0,
      }),
  )
}
