import {useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {Trans, useLingui} from '@lingui/react/macro'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {makeProfileLink} from '#/lib/routes/links'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useAtmosphereActivityQuery} from '#/state/queries/atmosphereActivity'
import {type ActivityActor} from '#/state/queries/atmosphereActivityTypes'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List} from '#/view/com/util/List'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {displayDuration} from '#/features/liveNow/utils'
import {
  type ActivityListItem,
  type ActivityRowContent,
  type ActivityRowItem,
  buildActivityListItems,
  getActivityRowContent,
} from './activityModel'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Activity'>

export function ActivityScreen({}: Props) {
  return (
    <Layout.Screen testID="activityScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Activity</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <ActivityList />
    </Layout.Screen>
  )
}

function ActivityList() {
  const initialNumToRender = useInitialNumToRender()
  const [isPTRing, setIsPTRing] = useState(false)
  const query = useAtmosphereActivityQuery()
  const items = buildActivityListItems(
    query.data,
    query.error ? cleanError(query.error) : undefined,
  )
  const hasActivityRows = items.some(item => item.type === 'activity')

  const onRefresh = async () => {
    setIsPTRing(true)
    try {
      await query.refetch()
    } finally {
      setIsPTRing(false)
    }
  }

  const onEndReached = async () => {
    if (
      query.isFetchingNextPage ||
      !query.hasNextPage ||
      query.error ||
      !hasActivityRows
    ) {
      return
    }
    try {
      await query.fetchNextPage()
    } catch {}
  }

  return (
    <List
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshing={isPTRing}
      onRefresh={() => void onRefresh()}
      onEndReached={() => void onEndReached()}
      onEndReachedThreshold={4}
      ListFooterComponent={
        hasActivityRows ? (
          <ListFooter
            isFetchingNextPage={query.isFetchingNextPage}
            hasNextPage={query.hasNextPage}
            error={query.error ? cleanError(query.error) : undefined}
            onRetry={query.fetchNextPage}
          />
        ) : undefined
      }
      initialNumToRender={initialNumToRender}
      windowSize={9}
      maxToRenderPerBatch={IS_IOS ? 5 : 1}
      updateCellsBatchingPeriod={40}
      sideBorders={false}
    />
  )
}

function ActivityRow({
  item,
  hideTopBorder,
}: {
  item: ActivityRowItem
  hideTopBorder: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const content = getActivityRowContent(item)

  return (
    <View style={[!hideTopBorder && a.border_t, t.atoms.border_contrast_low]}>
      <View style={[a.flex_row, a.align_start, a.gap_md, a.px_xl, a.py_lg]}>
        <UserAvatar
          avatar={content.actor?.avatar ?? null}
          size={40}
          type="user"
        />
        <View style={[a.flex_1, a.gap_xs]}>
          <ActivitySentence content={content} />
          <TimeElapsed timestamp={item.activity.record.indexedAt}>
            {({timeElapsed}) => (
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                {timeElapsed}
              </Text>
            )}
          </TimeElapsed>
        </View>
      </View>
      {content.type === 'photo' && (
        <View style={[a.px_xl, a.pb_lg]}>
          <Image
            source={{uri: content.imageUri}}
            style={[a.w_full, a.rounded_lg, {aspectRatio: content.aspectRatio}]}
            accessibilityLabel={content.alt || l`Photo`}
            accessibilityHint=""
            accessibilityIgnoresInvertColors
            contentFit="cover"
            loading="lazy"
            useAppleWebpCodec
          />
        </View>
      )}
    </View>
  )
}

function ActivitySentence({content}: {content: ActivityRowContent}) {
  const {i18n, t: l} = useLingui()
  const unknown = l`Unknown user`

  switch (content.type) {
    case 'recommendation': {
      const title = content.title || l`Untitled post`
      return (
        <Text style={[a.text_md, a.leading_snug]} emoji>
          <Trans>
            <ActorLink
              actor={content.actor}
              did={content.actorDid}
              unknown={unknown}
            />{' '}
            recommended{' '}
            <ActorLink
              actor={content.subjectActor}
              did={content.subjectDid}
              unknown={unknown}
            />
            ’s post <ActivityLink href={content.href} text={title} />
          </Trans>
        </Text>
      )
    }
    case 'document': {
      const title = content.title || l`Untitled post`
      return (
        <Text style={[a.text_md, a.leading_snug]} emoji>
          <Trans>
            <ActorLink
              actor={content.actor}
              did={content.actorDid}
              unknown={unknown}
            />{' '}
            published <ActivityLink href={content.href} text={title} />
          </Trans>
        </Text>
      )
    }
    case 'publication': {
      const name = content.name || l`Untitled publication`
      return (
        <Text style={[a.text_md, a.leading_snug]} emoji>
          <Trans>
            <ActorLink
              actor={content.actor}
              did={content.actorDid}
              unknown={unknown}
            />{' '}
            created the publication{' '}
            <ActivityLink href={content.href} text={name} />
          </Trans>
        </Text>
      )
    }
    case 'subscription': {
      const name = content.name || l`Untitled publication`
      return (
        <Text style={[a.text_md, a.leading_snug]} emoji>
          <Trans>
            <ActorLink
              actor={content.actor}
              did={content.actorDid}
              unknown={unknown}
            />{' '}
            subscribed to <ActivityLink href={content.href} text={name} />
          </Trans>
        </Text>
      )
    }
    case 'livestream': {
      const title = content.title || l`Untitled livestream`
      if (content.ended && content.durationInMinutes !== undefined) {
        const duration = displayDuration(i18n, content.durationInMinutes)
        return (
          <Text style={[a.text_md, a.leading_snug]} emoji>
            <Trans>
              <ActorLink
                actor={content.actor}
                did={content.actorDid}
                unknown={unknown}
              />{' '}
              livestreamed <ActivityEmphasis text={title} /> for {duration}
            </Trans>
          </Text>
        )
      }
      if (content.ended) {
        return (
          <Text style={[a.text_md, a.leading_snug]} emoji>
            <Trans>
              <ActorLink
                actor={content.actor}
                did={content.actorDid}
                unknown={unknown}
              />{' '}
              livestreamed <ActivityEmphasis text={title} />
            </Trans>
          </Text>
        )
      }
      return (
        <Text style={[a.text_md, a.leading_snug]} emoji>
          <Trans>
            <ActorLink
              actor={content.actor}
              did={content.actorDid}
              unknown={unknown}
            />{' '}
            is livestreaming <ActivityEmphasis text={title} />
          </Trans>
        </Text>
      )
    }
    case 'photo':
      return (
        <Text style={[a.text_md, a.leading_snug]} emoji>
          <Trans>
            <ActorLink
              actor={content.actor}
              did={content.actorDid}
              unknown={unknown}
            />{' '}
            posted a photo
          </Trans>
        </Text>
      )
    case 'generic':
      return (
        <Text style={[a.text_md, a.leading_snug]} emoji>
          <Trans>
            Activity from{' '}
            <ActorLink
              actor={content.actor}
              did={content.actorDid}
              unknown={unknown}
            />
          </Trans>
        </Text>
      )
  }
}

function ActorLink({
  actor,
  did,
  unknown,
}: {
  actor: ActivityActor | undefined
  did: string | undefined
  unknown: string
}) {
  const t = useTheme()
  const label = getActorLabel(actor, did, unknown)
  if (!did) return <ActivityEmphasis text={label} />

  return (
    <InlineLinkText
      label={label}
      to={makeProfileLink({did, handle: actor?.handle ?? ''})}
      style={[a.text_md, a.leading_snug, a.font_semi_bold, t.atoms.text]}
      emoji>
      {label}
    </InlineLinkText>
  )
}

function ActivityLink({href, text}: {href?: string; text: string}) {
  const t = useTheme()
  if (!href) return <ActivityEmphasis text={text} />

  return (
    <InlineLinkText
      label={text}
      to={href}
      disableMismatchWarning
      style={[a.text_md, a.leading_snug, a.font_semi_bold, t.atoms.text]}
      emoji>
      {text}
    </InlineLinkText>
  )
}

function ActivityEmphasis({text}: {text: string}) {
  return (
    <Text style={[a.text_md, a.leading_snug, a.font_semi_bold]} emoji>
      {text}
    </Text>
  )
}

function ActivityLoading() {
  return (
    <View style={[a.w_full, a.align_center, a.py_5xl]}>
      <Loader size="xl" />
    </View>
  )
}

function ActivityEmpty() {
  const {t: l} = useLingui()
  return (
    <EmptyState
      icon={AtomIcon}
      message={l`There’s no activity to show yet.`}
      testID="activityEmptyState"
    />
  )
}

function ActivityError({error}: {error: string}) {
  const {t: l} = useLingui()
  const query = useAtmosphereActivityQuery()
  return (
    <EmptyState
      icon={AtomIcon}
      message={l`Unable to load activity: ${error}`}
      testID="activityErrorState"
      button={{
        label: l`Retry loading activity`,
        text: l`Retry`,
        onPress: () => void query.refetch(),
        size: 'small',
        color: 'secondary',
      }}
    />
  )
}

function renderItem({item, index}: {item: ActivityListItem; index: number}) {
  switch (item.type) {
    case 'loading':
      return <ActivityLoading />
    case 'empty':
      return <ActivityEmpty />
    case 'error':
      return <ActivityError error={item.error} />
    case 'activity':
      return <ActivityRow item={item} hideTopBorder={index === 0} />
  }
}

function getActorLabel(
  actor: ActivityActor | undefined,
  did: string | undefined,
  unknown: string,
) {
  return actor?.handle
    ? sanitizeHandle(actor.handle, '@')
    : actor?.displayName || did || unknown
}

const keyExtractor = (item: ActivityListItem) => item.key
