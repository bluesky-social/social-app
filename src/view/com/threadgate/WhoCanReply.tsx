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
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useColorSchemeStyle} from '#/lib/hooks/useColorSchemeStyle'

import {colors} from '#/lib/styles'

export function WhoCanReply({
  post,
  style,
}: {
  post: AppBskyFeedDefs.PostView
  style?: StyleProp<ViewStyle>
}) {
  const containerStyles = useColorSchemeStyle(
    {
      borderColor: colors.blue1,
      backgroundColor: '#ebf6ff',
    },
    {
      borderColor: colors.gray6,
      backgroundColor: colors.gray8,
    },
  )
  const textStyles = useColorSchemeStyle(
    {color: colors.gray6},
    {color: colors.gray3},
  )
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
          {
            flexDirection: 'row',
            alignItems: !record.allow?.length ? 'center' : 'flex-start',
            gap: 12,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 15,
            paddingVertical: 10,
          },
          containerStyles,
          style,
        ]}>
        <FontAwesomeIcon
          icon={['far', 'comments']}
          size={21}
          color={textStyles.color}
          style={{marginTop: 2}}
        />
        <View style={{flexDirection: 'column', gap: 2}}>
          {!record.allow?.length ? (
            <Text type="md" style={textStyles}>
              <Trans>Replies to this thread are disabled</Trans>
            </Text>
          ) : (
            <>
              <Text type="md-bold" style={textStyles}>
                <Trans>Who can reply?</Trans>
              </Text>
              {record.allow.map((rule, i) => (
                <Text key={`rule-${i}`} type="md" style={textStyles}>
                  {'• '}
                  <Rule
                    rule={rule}
                    post={post}
                    lists={post.threadgate!.lists}
                  />
                </Text>
              ))}
            </>
          )}
        </View>
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
    return <Trans>Mentioned users</Trans>
  }
  if (AppBskyFeedThreadgate.isFollowingRule(rule)) {
    return (
      <Trans>
        Users followed by{' '}
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
