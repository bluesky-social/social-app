import React from 'react'
import {GestureResponderEvent, View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  AtUri,
} from '@atproto/api'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {
  useAddSavedFeedsMutation,
  usePreferencesQuery,
  useRemoveFeedMutation,
} from '#/state/queries/preferences'
import {sanitizeHandle} from 'lib/strings/handles'
import {useSession} from 'state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import * as Toast from 'view/com/util/Toast'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {useRichText} from '#/components/hooks/useRichText'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import {Link as InternalLink, LinkProps} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

export function Default({
  type,
  view,
}:
  | {
      type: 'feed'
      view: AppBskyFeedDefs.GeneratorView
    }
  | {
      type: 'list'
      view: AppBskyGraphDefs.ListView
    }) {
  const displayName = type === 'feed' ? view.displayName : view.name
  return (
    <Link feed={view}>
      <Outer>
        <Header>
          <Avatar src={view.avatar} />
          <TitleAndByline title={displayName} creator={view.creator} />
          <Action uri={view.uri} pin />
        </Header>
        <Description description={view.description} />
        {type === 'feed' && <Likes count={view.likeCount || 0} />}
      </Outer>
    </Link>
  )
}

export function Link({
  children,
  feed,
}: {
  feed: AppBskyFeedDefs.GeneratorView | AppBskyGraphDefs.ListView
} & Omit<LinkProps, 'to'>) {
  const href = React.useMemo(() => {
    return createProfileFeedHref({feed})
  }, [feed])
  return <InternalLink to={href}>{children}</InternalLink>
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
}: {
  title: string
  creator?: AppBskyActorDefs.ProfileViewBasic
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
          <Trans>Feed by {sanitizeHandle(creator.handle, '@')}</Trans>
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
  const [rt, isResolving] = useRichText(description || '')
  if (!description) return null
  return isResolving ? (
    <RichText value={description} style={[a.leading_snug]} />
  ) : (
    <RichText value={rt} style={[a.leading_snug]} />
  )
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

export function Action({uri, pin}: {uri: string; pin?: boolean}) {
  const {hasSession} = useSession()
  if (!hasSession) return null
  return <ActionInner uri={uri} pin={pin} />
}

function ActionInner({uri, pin}: {uri: string; pin?: boolean}) {
  const {_} = useLingui()
  const {data: preferences} = usePreferencesQuery()
  const {isPending: isAddSavedFeedPending, mutateAsync: saveFeeds} =
    useAddSavedFeedsMutation()
  const {isPending: isRemovePending, mutateAsync: removeFeed} =
    useRemoveFeedMutation()
  const savedFeedConfig = React.useMemo(() => {
    return preferences?.savedFeeds?.find(
      feed => feed.type === 'feed' && feed.value === uri,
    )
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
              type: 'feed',
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
    [_, pin, saveFeeds, removeFeed, uri, savedFeedConfig],
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
