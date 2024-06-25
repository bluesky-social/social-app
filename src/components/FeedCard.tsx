import React from 'react'
import {GestureResponderEvent, View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  AtUri,
  RichText as RichTextApi,
} from '@atproto/api'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {
  useAddSavedFeedsMutation,
  usePreferencesQuery,
  useRemoveFeedMutation,
} from '#/state/queries/preferences'
import {sanitizeHandle} from 'lib/strings/handles'
import {precacheFeedFromGeneratorView, precacheList} from 'state/queries/feed'
import {useSession} from 'state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import * as Toast from 'view/com/util/Toast'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import {Link as InternalLink, LinkProps} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

type Props =
  | {
      type: 'feed'
      view: AppBskyFeedDefs.GeneratorView
    }
  | {
      type: 'list'
      view: AppBskyGraphDefs.ListView
    }

export function Default(props: Props) {
  const {type, view} = props
  const displayName = type === 'feed' ? view.displayName : view.name
  const purpose = type === 'list' ? view.purpose : undefined
  return (
    <Link label={displayName} {...props}>
      <Outer>
        <Header>
          <Avatar src={view.avatar} />
          <TitleAndByline
            title={displayName}
            creator={view.creator}
            type={type}
            purpose={purpose}
          />
          <Action uri={view.uri} pin type={type} purpose={purpose} />
        </Header>
        <Description description={view.description} />
        {type === 'feed' && <Likes count={view.likeCount || 0} />}
      </Outer>
    </Link>
  )
}

export function Link({
  type,
  view,
  label,
  children,
}: Props & Omit<LinkProps, 'to'>) {
  const queryClient = useQueryClient()

  const href = React.useMemo(() => {
    return createProfileFeedHref({feed: view})
  }, [view])

  return (
    <InternalLink
      to={href}
      label={label}
      onPress={() => {
        if (type === 'feed') {
          precacheFeedFromGeneratorView(queryClient, view)
        } else {
          precacheList(queryClient, view)
        }
      }}>
      {children}
    </InternalLink>
  )
}

export function Outer({children}: {children: React.ReactNode}) {
  return <View style={[a.flex_1, a.gap_md]}>{children}</View>
}

export function Header({children}: {children: React.ReactNode}) {
  return (
    <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_md]}>
      {children}
    </View>
  )
}

export type AvatarProps = {src: string | undefined; size?: number}

export function Avatar({src, size = 40}: AvatarProps) {
  return <UserAvatar type="algo" size={size} avatar={src} />
}

export function AvatarPlaceholder({size = 40}: Omit<AvatarProps, 'src'>) {
  const t = useTheme()
  return (
    <View
      style={[
        t.atoms.bg_contrast_25,
        {
          width: size,
          height: size,
          borderRadius: 8,
        },
      ]}
    />
  )
}

export function TitleAndByline({
  title,
  creator,
  type,
  purpose,
}: {
  title: string
  creator?: AppBskyActorDefs.ProfileViewBasic
  type: 'feed' | 'list'
  purpose?: AppBskyGraphDefs.ListView['purpose']
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_1]}>
      <Text style={[a.text_md, a.font_bold, a.leading_snug]} numberOfLines={1}>
        {title}
      </Text>
      {creator && (
        <Text
          style={[a.leading_snug, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {type === 'list' && purpose === 'app.bsky.graph.defs#curatelist' ? (
            <Trans>List by {sanitizeHandle(creator.handle, '@')}</Trans>
          ) : type === 'list' && purpose === 'app.bsky.graph.defs#modlist' ? (
            <Trans>
              Moderation list by {sanitizeHandle(creator.handle, '@')}
            </Trans>
          ) : (
            <Trans>Feed by {sanitizeHandle(creator.handle, '@')}</Trans>
          )}
        </Text>
      )}
    </View>
  )
}

export function TitleAndBylinePlaceholder({creator}: {creator?: boolean}) {
  const t = useTheme()

  return (
    <View style={[a.flex_1, a.gap_xs]}>
      <View
        style={[
          a.rounded_xs,
          t.atoms.bg_contrast_50,
          {
            width: '60%',
            height: 14,
          },
        ]}
      />

      {creator && (
        <View
          style={[
            a.rounded_xs,
            t.atoms.bg_contrast_25,
            {
              width: '40%',
              height: 10,
            },
          ]}
        />
      )}
    </View>
  )
}

export function Description({description}: {description?: string}) {
  const rt = React.useMemo(() => {
    if (!description) return
    const rt = new RichTextApi({text: description || ''})
    rt.detectFacetsWithoutResolution()
    return rt
  }, [description])
  if (!rt) return null
  return <RichText value={rt} style={[a.leading_snug]} disableLinks />
}

export function Likes({count}: {count: number}) {
  const t = useTheme()
  return (
    <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
      {plural(count || 0, {
        one: 'Liked by # user',
        other: 'Liked by # users',
      })}
    </Text>
  )
}

export function Action({
  uri,
  pin,
  type,
  purpose,
}: {
  uri: string
  pin?: boolean
  type: 'feed' | 'list'
  purpose?: AppBskyGraphDefs.ListView['purpose']
}) {
  const {hasSession} = useSession()
  if (!hasSession || purpose !== 'app.bsky.graph.defs#curatelist') return null
  return <ActionInner uri={uri} pin={pin} type={type} />
}

function ActionInner({
  uri,
  pin,
  type,
}: {
  uri: string
  pin?: boolean
  type: 'feed' | 'list'
}) {
  const {_} = useLingui()
  const {data: preferences} = usePreferencesQuery()
  const {isPending: isAddSavedFeedPending, mutateAsync: saveFeeds} =
    useAddSavedFeedsMutation()
  const {isPending: isRemovePending, mutateAsync: removeFeed} =
    useRemoveFeedMutation()
  const savedFeedConfig = React.useMemo(() => {
    return preferences?.savedFeeds?.find(feed => feed.value === uri)
  }, [preferences?.savedFeeds, uri])
  const removePromptControl = Prompt.usePromptControl()
  const isPending = isAddSavedFeedPending || isRemovePending

  const toggleSave = React.useCallback(
    async (e: GestureResponderEvent) => {
      e.preventDefault()
      e.stopPropagation()

      try {
        if (savedFeedConfig) {
          await removeFeed(savedFeedConfig)
        } else {
          await saveFeeds([
            {
              type,
              value: uri,
              pinned: pin || false,
            },
          ])
        }
        Toast.show(_(msg`Feeds updated!`))
      } catch (e: any) {
        logger.error(e, {context: `FeedCard: failed to update feeds`, pin})
        Toast.show(_(msg`Failed to update feeds`))
      }
    },
    [_, pin, saveFeeds, removeFeed, uri, savedFeedConfig, type],
  )

  const onPrompRemoveFeed = React.useCallback(
    async (e: GestureResponderEvent) => {
      e.preventDefault()
      e.stopPropagation()

      removePromptControl.open()
    },
    [removePromptControl],
  )

  return (
    <>
      <Button
        disabled={isPending}
        label={_(msg`Add this feed to your feeds`)}
        size="small"
        variant="ghost"
        color="secondary"
        shape="square"
        onPress={savedFeedConfig ? onPrompRemoveFeed : toggleSave}>
        {savedFeedConfig ? (
          <ButtonIcon size="md" icon={isPending ? Loader : Trash} />
        ) : (
          <ButtonIcon size="md" icon={isPending ? Loader : Plus} />
        )}
      </Button>

      <Prompt.Basic
        control={removePromptControl}
        title={_(msg`Remove from my feeds?`)}
        description={_(
          msg`Are you sure you want to remove this from your feeds?`,
        )}
        onConfirm={toggleSave}
        confirmButtonCta={_(msg`Remove`)}
        confirmButtonColor="negative"
      />
    </>
  )
}

export function createProfileFeedHref({
  feed,
}: {
  feed: AppBskyFeedDefs.GeneratorView | AppBskyGraphDefs.ListView
}) {
  const urip = new AtUri(feed.uri)
  const type = urip.collection === 'app.bsky.feed.generator' ? 'feed' : 'list'
  const handleOrDid = feed.creator.handle || feed.creator.did
  return `/profile/${handleOrDid}/${type === 'feed' ? 'feed' : 'lists'}/${
    urip.rkey
  }`
}
