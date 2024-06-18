import React from 'react'
import {Keyboard, StyleProp, View, ViewStyle} from 'react-native'
import {AppBskyFeedDefs, AppBskyGraphDefs, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useAnalytics} from '#/lib/analytics/analytics'
import {createThreadgate} from '#/lib/api'
import {useColorSchemeStyle} from '#/lib/hooks/useColorSchemeStyle'
import {usePalette} from '#/lib/hooks/usePalette'
import {makeListLink, makeProfileLink} from '#/lib/routes/links'
import {colors} from '#/lib/styles'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {useModalControls} from '#/state/modals'
import {RQKEY_ROOT as POST_THREAD_RQKEY_ROOT} from '#/state/queries/post-thread'
import {
  ThreadgateSetting,
  threadgateViewToSettings,
} from '#/state/queries/threadgate'
import {useAgent} from '#/state/session'
import * as Toast from 'view/com/util/Toast'
import {Button} from '#/components/Button'
import {TextLink} from '../util/Link'
import {Text} from '../util/text/Text'

export function WhoCanReply({
  post,
  isThreadAuthor,
  style,
}: {
  post: AppBskyFeedDefs.PostView
  isThreadAuthor: boolean
  style?: StyleProp<ViewStyle>
}) {
  const {track} = useAnalytics()
  const {_} = useLingui()
  const pal = usePalette('default')
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {openModal} = useModalControls()
  const containerStyles = useColorSchemeStyle(
    {
      backgroundColor: pal.colors.unreadNotifBg,
    },
    {
      backgroundColor: pal.colors.unreadNotifBg,
    },
  )
  const textStyles = useColorSchemeStyle(
    {color: colors.blue5},
    {color: colors.blue1},
  )
  const hoverStyles = useColorSchemeStyle(
    {
      backgroundColor: colors.white,
    },
    {
      backgroundColor: pal.colors.background,
    },
  )
  const settings = React.useMemo(
    () => threadgateViewToSettings(post.threadgate),
    [post],
  )
  const isRootPost = !('reply' in post.record)

  const onPressEdit = () => {
    track('Post:EditThreadgateOpened')
    if (isNative && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }
    openModal({
      name: 'threadgate',
      settings,
      async onConfirm(newSettings: ThreadgateSetting[]) {
        try {
          if (newSettings.length) {
            await createThreadgate(agent, post.uri, newSettings)
          } else {
            await agent.api.com.atproto.repo.deleteRecord({
              repo: agent.session!.did,
              collection: 'app.bsky.feed.threadgate',
              rkey: new AtUri(post.uri).rkey,
            })
          }
          Toast.show('Thread settings updated')
          queryClient.invalidateQueries({
            queryKey: [POST_THREAD_RQKEY_ROOT],
          })
          track('Post:ThreadgateEdited')
        } catch (err) {
          Toast.show(
            'There was an issue. Please check your internet connection and try again.',
          )
          logger.error('Failed to edit threadgate', {message: err})
        }
      },
    })
  }

  if (!isRootPost) {
    return null
  }
  if (!settings.length && !isThreadAuthor) {
    return null
  }

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingLeft: 18,
          paddingRight: 14,
          paddingVertical: 10,
          borderTopWidth: 1,
        },
        pal.border,
        containerStyles,
        style,
      ]}>
      <View style={{flex: 1, paddingVertical: 6}}>
        <Text type="sm" style={[{flexWrap: 'wrap'}, textStyles]}>
          {!settings.length ? (
            <Trans>Everybody can reply.</Trans>
          ) : settings[0].type === 'nobody' ? (
            <Trans>Replies to this thread are disabled.</Trans>
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
              can reply.
            </Trans>
          )}
        </Text>
      </View>
      {isThreadAuthor && (
        <View>
          <Button label={_(msg`Edit`)} onPress={onPressEdit}>
            {({hovered}) => (
              <View
                style={[
                  hovered && hoverStyles,
                  {paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8},
                ]}>
                <Text type="sm" style={pal.link}>
                  <Trans>Edit</Trans>
                </Text>
              </View>
            )}
          </Button>
        </View>
      )}
    </View>
  )
}

function Rule({
  rule,
  post,
  lists,
}: {
  rule: ThreadgateSetting
  post: AppBskyFeedDefs.PostView
  lists: AppBskyGraphDefs.ListViewBasic[] | undefined
}) {
  const pal = usePalette('default')
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
          style={pal.link}
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
            style={pal.link}
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
