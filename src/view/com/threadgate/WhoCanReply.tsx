import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedThreadgate,
  AppBskyGraphDefs,
  AtUri,
} from '@atproto/api'
import {Trans} from '@lingui/macro'
import {usePalette} from '#/lib/hooks/usePalette'
import {Text} from '../util/text/Text'
import {TextLink} from '../util/Link'
import {makeProfileLink, makeListLink} from '#/lib/routes/links'

export function WhoCanReply({
  post,
  style,
}: {
  post: AppBskyFeedDefs.PostView
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const record = React.useMemo(
    () =>
      post.threadgate &&
      AppBskyFeedThreadgate.isRecord(post.threadgate.record) &&
      AppBskyFeedThreadgate.validateRecord(post.threadgate.record).success
        ? post.threadgate.record
        : null,
    [post],
  )
  if (record) {
    return (
      <View
        style={[
          pal.viewLight,
          {
            paddingHorizontal: 12,
            paddingVertical: 10,
          },
          style,
        ]}>
        <Text type="md" style={pal.textLight}>
          {!record.allow?.length ? (
            <Trans>Replies to this thread are disabled</Trans>
          ) : (
            <Trans>
              Only{' '}
              {record.allow.map((rule, i) => (
                <>
                  <Rule
                    rule={rule}
                    post={post}
                    lists={post.threadgate!.lists}
                  />
                  <Separator i={i} length={record.allow!.length} />
                </>
              ))}{' '}
              can reply.
            </Trans>
          )}
        </Text>
      </View>
    )
  }
  return null
}

function Rule({
  rule,
  post,
  lists,
}: {
  rule: any
  post: AppBskyFeedDefs.PostView
  lists: AppBskyGraphDefs.ListViewBasic[] | undefined
}) {
  const pal = usePalette('default')
  if (AppBskyFeedThreadgate.isMentionRule(rule)) {
    return <Trans>mentioned users</Trans>
  }
  if (AppBskyFeedThreadgate.isFollowingRule(rule)) {
    return (
      <Trans>
        users followed by{' '}
        <TextLink
          href={makeProfileLink(post.author)}
          text={`@${post.author.handle}`}
          style={pal.link}
        />
      </Trans>
    )
  }
  if (AppBskyFeedThreadgate.isListRule(rule)) {
    const list = lists?.find(l => l.uri === rule.list)
    if (list) {
      const listUrip = new AtUri(list.uri)
      return (
        <Trans>
          <TextLink
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
