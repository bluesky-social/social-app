import {Fragment, useMemo, useRef} from 'react'
import {
  Keyboard,
  Platform,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  type AppBskyGraphDefs,
  AtUri,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {makeListLink, makeProfileLink} from '#/lib/routes/links'
import {logger} from '#/logger'
import {
  type ThreadgateAllowUISetting,
  threadgateViewToAllowUISetting,
} from '#/state/queries/threadgate'
import {atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {
  PostInteractionSettingsDialog,
  usePrefetchPostInteractionSettings,
} from '#/components/dialogs/PostInteractionSettingsDialog'
import {TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronDownIcon} from '#/components/icons/Chevron'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSignIcon} from '#/components/icons/CircleBanSign'
import {Earth_Stroke2_Corner0_Rounded as EarthIcon} from '#/components/icons/Globe'
import {Group3_Stroke2_Corner0_Rounded as GroupIcon} from '#/components/icons/Group'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import * as bsky from '#/types/bsky'

interface WhoCanReplyProps {
  post: AppBskyFeedDefs.PostView
  isThreadAuthor: boolean
  style?: StyleProp<ViewStyle>
}

export function WhoCanReply({post, isThreadAuthor, style}: WhoCanReplyProps) {
  const {_} = useLingui()
  const t = useTheme()
  const infoDialogControl = useDialogControl()
  const editDialogControl = useDialogControl()

  /*
   * `WhoCanReply` is only used for root posts atm, in case this changes
   * unexpectedly, we should check to make sure it's for sure the root URI.
   */
  const rootUri =
    bsky.dangerousIsType<AppBskyFeedPost.Record>(
      post.record,
      AppBskyFeedPost.isRecord,
    ) && post.record.reply?.root
      ? post.record.reply.root.uri
      : post.uri
  const settings = useMemo(() => {
    return threadgateViewToAllowUISetting(post.threadgate)
  }, [post.threadgate])

  const prefetchPostInteractionSettings = usePrefetchPostInteractionSettings({
    postUri: post.uri,
    rootPostUri: rootUri,
  })
  const prefetchPromise = useRef<Promise<void>>(Promise.resolve())

  const prefetch = () => {
    prefetchPromise.current = prefetchPostInteractionSettings()
  }

  const anyoneCanReply =
    settings.length === 1 && settings[0].type === 'everybody'
  const noOneCanReply = settings.length === 1 && settings[0].type === 'nobody'
  const description = anyoneCanReply
    ? _(msg`Everybody can reply`)
    : noOneCanReply
      ? _(msg`Replies disabled`)
      : _(msg`Some people can reply`)

  const onPressOpen = () => {
    if (IS_NATIVE && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }
    if (isThreadAuthor) {
      logger.metric('thread:click:editOwnThreadgate', {})

      // wait on prefetch if it manages to resolve in under 200ms
      // otherwise, proceed immediately and show the spinner -sfn
      Promise.race([
        prefetchPromise.current,
        new Promise(res => setTimeout(res, 200)),
      ]).finally(() => {
        editDialogControl.open()
      })
    } else {
      logger.metric('thread:click:viewSomeoneElsesThreadgate', {})

      infoDialogControl.open()
    }
  }

  return (
    <>
      <Button
        label={
          isThreadAuthor ? _(msg`Edit who can reply`) : _(msg`Who can reply`)
        }
        onPress={onPressOpen}
        {...(isThreadAuthor
          ? Platform.select({
              web: {
                onHoverIn: prefetch,
              },
              native: {
                onPressIn: prefetch,
              },
            })
          : {})}
        hitSlop={HITSLOP_10}>
        {({hovered, focused, pressed}) => (
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.gap_xs,
              (hovered || focused || pressed) && native({opacity: 0.5}),
              style,
            ]}>
            <Icon
              color={
                isThreadAuthor ? t.palette.primary_500 : t.palette.contrast_400
              }
              width={16}
              settings={settings}
            />
            <Text
              style={[
                a.text_sm,
                a.leading_tight,
                isThreadAuthor
                  ? {color: t.palette.primary_500}
                  : t.atoms.text_contrast_medium,
                (hovered || focused || pressed) && web(a.underline),
              ]}>
              {description}
            </Text>

            {isThreadAuthor && (
              <TinyChevronDownIcon width={8} fill={t.palette.primary_500} />
            )}
          </View>
        )}
      </Button>

      {isThreadAuthor ? (
        <PostInteractionSettingsDialog
          postUri={post.uri}
          rootPostUri={rootUri}
          control={editDialogControl}
          initialThreadgateView={post.threadgate}
        />
      ) : (
        <WhoCanReplyDialog
          control={infoDialogControl}
          post={post}
          settings={settings}
          embeddingDisabled={Boolean(post.viewer?.embeddingDisabled)}
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
  const isEverybody =
    settings.length === 0 ||
    settings.every(setting => setting.type === 'everybody')
  const isNobody = !!settings.find(gate => gate.type === 'nobody')
  const IconComponent = isEverybody
    ? EarthIcon
    : isNobody
      ? CircleBanSignIcon
      : GroupIcon
  return <IconComponent fill={color} width={width} />
}

function WhoCanReplyDialog({
  control,
  post,
  settings,
  embeddingDisabled,
}: {
  control: Dialog.DialogControlProps
  post: AppBskyFeedDefs.PostView
  settings: ThreadgateAllowUISetting[]
  embeddingDisabled: boolean
}) {
  const {_} = useLingui()

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Dialog: adjust who can interact with this post`)}
        style={web({maxWidth: 400})}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_semi_bold, a.text_xl, a.pb_sm]}>
            <Trans>Who can interact with this post?</Trans>
          </Text>
          <Rules
            post={post}
            settings={settings}
            embeddingDisabled={embeddingDisabled}
          />
        </View>
        {IS_NATIVE && (
          <Button
            label={_(msg`Close`)}
            onPress={() => control.close()}
            size="small"
            variant="solid"
            color="secondary"
            style={[a.mt_5xl]}>
            <ButtonText>
              <Trans>Close</Trans>
            </ButtonText>
          </Button>
        )}
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Rules({
  post,
  settings,
  embeddingDisabled,
}: {
  post: AppBskyFeedDefs.PostView
  settings: ThreadgateAllowUISetting[]
  embeddingDisabled: boolean
}) {
  const t = useTheme()

  return (
    <>
      <Text
        style={[
          a.text_sm,
          a.leading_snug,
          a.flex_wrap,
          t.atoms.text_contrast_medium,
        ]}>
        {settings.length === 0 ? (
          <Trans>
            This post has an unknown type of threadgate on it. Your app may be
            out of date.
          </Trans>
        ) : settings[0].type === 'everybody' ? (
          <Trans>Everybody can reply to this post.</Trans>
        ) : settings[0].type === 'nobody' ? (
          <Trans>Replies to this post are disabled.</Trans>
        ) : (
          <Trans>
            Only{' '}
            {settings.map((rule, i) => (
              <Fragment key={`rule-${i}`}>
                <Rule rule={rule} post={post} lists={post.threadgate!.lists} />
                <Separator i={i} length={settings.length} />
              </Fragment>
            ))}{' '}
            can reply.
          </Trans>
        )}{' '}
      </Text>
      {embeddingDisabled && (
        <Text
          style={[
            a.text_sm,
            a.leading_snug,
            a.flex_wrap,
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>No one but the author can quote this post.</Trans>
        </Text>
      )}
    </>
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
  if (rule.type === 'mention') {
    return <Trans>mentioned users</Trans>
  }
  if (rule.type === 'followers') {
    return (
      <Trans>
        users following{' '}
        <InlineLinkText
          label={`@${post.author.handle}`}
          to={makeProfileLink(post.author)}
          style={[a.text_sm, a.leading_snug]}>
          @{post.author.handle}
        </InlineLinkText>
      </Trans>
    )
  }
  if (rule.type === 'following') {
    return (
      <Trans>
        users followed by{' '}
        <InlineLinkText
          label={`@${post.author.handle}`}
          to={makeProfileLink(post.author)}
          style={[a.text_sm, a.leading_snug]}>
          @{post.author.handle}
        </InlineLinkText>
      </Trans>
    )
  }
  if (rule.type === 'list') {
    const list = lists?.find(l => l.uri === rule.list)
    if (list) {
      const listUrip = new AtUri(list.uri)
      return (
        <Trans>
          <InlineLinkText
            label={list.name}
            to={makeListLink(listUrip.hostname, listUrip.rkey)}
            style={[a.text_sm, a.leading_snug]}>
            {list.name}
          </InlineLinkText>{' '}
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
