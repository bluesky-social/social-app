import React from 'react'
import {View} from 'react-native'
import {
  type AppBskyGraphDefs,
  AtUri,
  moderateUserList,
  type ModerationUI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {precacheList} from '#/state/queries/feed'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {
  Avatar,
  Description,
  Header,
  Outer,
  SaveButton,
} from '#/components/FeedCard'
import {Link as InternalLink, type LinkProps} from '#/components/Link'
import * as Hider from '#/components/moderation/Hider'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

/*
 * This component is based on `FeedCard` and is tightly coupled with that
 * component. Please refer to `FeedCard` for more context.
 */

export {
  Avatar,
  AvatarPlaceholder,
  Description,
  Header,
  Outer,
  SaveButton,
  TitleAndBylinePlaceholder,
} from '#/components/FeedCard'

const CURATELIST = 'app.bsky.graph.defs#curatelist'
const MODLIST = 'app.bsky.graph.defs#modlist'

type Props = {
  view: AppBskyGraphDefs.ListView
  showPinButton?: boolean
}

export function Default(
  props: Props & Omit<LinkProps, 'to' | 'label' | 'children'>,
) {
  const {view, showPinButton} = props
  const moderationOpts = useModerationOpts()
  const moderation = moderationOpts
    ? moderateUserList(view, moderationOpts)
    : undefined

  return (
    <Link {...props}>
      <Outer>
        <Header>
          <Avatar src={view.avatar} />
          <TitleAndByline
            title={view.name}
            creator={view.creator}
            purpose={view.purpose}
            modUi={moderation?.ui('contentView')}
          />
          {showPinButton && view.purpose === CURATELIST && (
            <SaveButton view={view} pin />
          )}
        </Header>
        <Description description={view.description} />
      </Outer>
    </Link>
  )
}

export function Link({
  view,
  children,
  ...props
}: Props & Omit<LinkProps, 'to' | 'label'>) {
  const queryClient = useQueryClient()

  const href = React.useMemo(() => {
    return createProfileListHref({list: view})
  }, [view])

  React.useEffect(() => {
    precacheList(queryClient, view)
  }, [view, queryClient])

  return (
    <InternalLink label={view.name} to={href} {...props}>
      {children}
    </InternalLink>
  )
}

export function TitleAndByline({
  title,
  creator,
  purpose = CURATELIST,
  modUi,
}: {
  title: string
  creator?: bsky.profile.AnyProfileView
  purpose?: AppBskyGraphDefs.ListView['purpose']
  modUi?: ModerationUI
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()

  return (
    <View style={[a.flex_1]}>
      <Hider.Outer
        modui={modUi}
        isContentVisibleInitialState={
          creator && currentAccount?.did === creator.did
        }
        allowOverride={creator && currentAccount?.did === creator.did}>
        <Hider.Mask>
          <Text
            style={[a.text_md, a.font_bold, a.leading_snug, a.italic]}
            numberOfLines={1}>
            <Trans>Hidden list</Trans>
          </Text>
        </Hider.Mask>
        <Hider.Content>
          <Text
            emoji
            style={[a.text_md, a.font_bold, a.leading_snug]}
            numberOfLines={1}>
            {title}
          </Text>
        </Hider.Content>
      </Hider.Outer>

      {creator && (
        <Text
          emoji
          style={[a.leading_snug, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {purpose === MODLIST
            ? _(msg`Moderation list by ${sanitizeHandle(creator.handle, '@')}`)
            : _(msg`List by ${sanitizeHandle(creator.handle, '@')}`)}
        </Text>
      )}
    </View>
  )
}

export function createProfileListHref({
  list,
}: {
  list: AppBskyGraphDefs.ListView
}) {
  const urip = new AtUri(list.uri)
  const handleOrDid = list.creator.handle || list.creator.did
  return `/profile/${handleOrDid}/lists/${urip.rkey}`
}
