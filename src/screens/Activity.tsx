import {useState} from 'react'
import {Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

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
import {createActivitySubjectView} from '#/screens/activitySubjectView'
import {atoms as a, tokens, useTheme, utils} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {Button, ButtonText} from '#/components/Button'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {
  PublicationCard,
  StandardSiteEmbed,
} from '#/components/Post/Embed/StandardSiteEmbed'
import {StandardSiteCompactDocumentCard} from '#/components/Post/Embed/StandardSiteEmbed/StandardSiteCompactDocumentCard'
import type * as ssTypes from '#/components/Post/Embed/StandardSiteEmbed/types'
import {isStandardSitePublicationEmbed} from '#/components/Post/Embed/StandardSiteEmbed/utils'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {displayDuration} from '#/features/liveNow/utils'
import {type app} from '#/lexicons'
import type * as bsky from '#/types/bsky'
import {
  type ActivityGroupRowItem,
  type ActivityListItem,
  type ActivityRowContent,
  type ActivityRowItem,
  buildActivityListItems,
  getActivityRowContent,
  getRecommendedDocumentUri,
  getSubscribedPublicationUri,
} from './activityModel'

const GROUP_AVATAR_SIZE = 40
const GROUPED_ACTIVITY_ACTOR_SIZE = 28
const GROUP_CONTENT_INDENT = GROUP_AVATAR_SIZE + tokens.space.md

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
  const hasActivityRows = items.some(
    item => item.type === 'activity' || item.type === 'group',
  )

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

export function ActivityRow({
  item,
  hideTopBorder,
}: {
  item: ActivityRowItem
  hideTopBorder: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const content = getActivityRowContent(item)
  const documentView =
    content.type === 'document'
      ? createSafeActivitySubjectView({
          uri: item.activity.record.uri,
          associatedRecords: item.associatedRecords,
          actors: item.actors,
        })
      : undefined

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
      {documentView && (
        <View style={[a.px_xl, a.pb_lg, {marginLeft: GROUP_CONTENT_INDENT}]}>
          <StandardSiteEmbed view={documentView} />
        </View>
      )}
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

function ActivityGroupRow({
  item,
  hideTopBorder,
}: {
  item: ActivityGroupRowItem
  hideTopBorder: boolean
}) {
  if (item.group.groupBy === 'subject') {
    return <SubjectActivityGroupRow item={item} hideTopBorder={hideTopBorder} />
  }

  if (
    item.group.groupBy === 'actor' &&
    item.group.collection === 'site.standard.graph.recommend'
  ) {
    return (
      <ActorRecommendationGroupRow item={item} hideTopBorder={hideTopBorder} />
    )
  }

  if (
    item.group.groupBy === 'actor' &&
    item.group.collection === 'site.standard.graph.subscription'
  ) {
    return (
      <ActorSubscriptionGroupRow item={item} hideTopBorder={hideTopBorder} />
    )
  }

  if (
    item.group.groupBy === 'actor' &&
    item.group.collection === 'site.standard.document'
  ) {
    return <ActorDocumentGroupRow item={item} hideTopBorder={hideTopBorder} />
  }

  return (
    <View style={{borderColor: 'red', borderWidth: 2}}>
      {item.group.items.map((activity, index) => (
        <ActivityRow
          key={activity.record.uri}
          item={createGroupedActivityRowItem(item, activity)}
          hideTopBorder={index === 0}
        />
      ))}
    </View>
  )
}

/**
 * Renders recommendations from one actor as a single expandable Activity row.
 */
export function ActorRecommendationGroupRow({
  item,
  hideTopBorder,
}: {
  item: ActivityGroupRowItem
  hideTopBorder: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const [expanded, setExpanded] = useState(false)
  const actorDid = item.group.actor
  const actor = actorDid ? item.actors[actorDid] : undefined
  const children = item.group.items.map(activity => ({
    key: activity.record.uri,
    view: createSafeActivitySubjectView({
      uri: getRecommendedDocumentUri(activity, item.associatedRecords),
      associatedRecords: item.associatedRecords,
      actors: item.actors,
    }),
  }))
  const visibleChildren = expanded ? children : children.slice(0, 2)
  const canExpand = item.group.items.length > 2

  return (
    <View style={[!hideTopBorder && a.border_t, t.atoms.border_contrast_low]}>
      <View style={[a.flex_row, a.align_start, a.gap_md, a.px_xl, a.pt_lg]}>
        <UserAvatar
          avatar={actor?.avatar ?? null}
          size={GROUP_AVATAR_SIZE}
          type="user"
        />
        <View style={[a.flex_1, a.gap_sm]}>
          <Text style={[a.text_md, a.leading_snug]} emoji>
            <Trans>
              <ActorLink
                actor={actor}
                did={actorDid}
                unknown={l`Unknown user`}
              />{' '}
              recommended{' '}
              <Plural
                value={item.group.items.length}
                one="# post"
                other="# posts"
              />
            </Trans>
            <TimeElapsed timestamp={item.group.indexedAt}>
              {({timeElapsed}) => (
                <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                  {' · '}
                  {timeElapsed}
                </Text>
              )}
            </TimeElapsed>
          </Text>
        </View>
      </View>
      <View style={[a.px_xl, a.pb_lg]}>
        <View style={[a.gap_xs, {marginLeft: GROUP_CONTENT_INDENT}]}>
          {visibleChildren.map(child => (
            <StandardSiteCompactDocumentCard
              key={child.key}
              view={child.view}
            />
          ))}
          {canExpand && (
            <Button
              testID={`activity-group-toggle-${item.group.id}`}
              label={expanded ? l`See less` : l`See more`}
              accessibilityHint=""
              color="secondary"
              size="small"
              onPress={() => setExpanded(value => !value)}
              style={a.self_start}>
              <ButtonText>{expanded ? l`See less` : l`See more`}</ButtonText>
            </Button>
          )}
        </View>
      </View>
    </View>
  )
}

/**
 * Renders documents from one actor as a single expandable Activity row.
 */
export function ActorDocumentGroupRow({
  item,
  hideTopBorder,
}: {
  item: ActivityGroupRowItem
  hideTopBorder: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const [expanded, setExpanded] = useState(false)
  const actorDid = item.group.actor
  const actor = actorDid ? item.actors[actorDid] : undefined
  const children = item.group.items.map(activity => ({
    key: activity.record.uri,
    view: createSafeActivitySubjectView({
      uri: activity.record.uri,
      associatedRecords: item.associatedRecords,
      actors: item.actors,
    }),
  }))
  const visibleChildren = expanded ? children : children.slice(0, 2)
  const canExpand = children.length > 2

  return (
    <View style={[!hideTopBorder && a.border_t, t.atoms.border_contrast_low]}>
      <View style={[a.flex_row, a.align_start, a.gap_md, a.px_xl, a.pt_lg]}>
        <UserAvatar
          avatar={actor?.avatar ?? null}
          size={GROUP_AVATAR_SIZE}
          type="user"
        />
        <View style={[a.flex_1, a.gap_sm]}>
          <Text style={[a.text_md, a.leading_snug]} emoji>
            <Trans>
              <ActorLink
                actor={actor}
                did={actorDid}
                unknown={l`Unknown user`}
              />{' '}
              published{' '}
              <Plural
                value={item.group.items.length}
                one="# post"
                other="# posts"
              />
            </Trans>
            <TimeElapsed timestamp={item.group.indexedAt}>
              {({timeElapsed}) => (
                <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                  {' · '}
                  {timeElapsed}
                </Text>
              )}
            </TimeElapsed>
          </Text>
        </View>
      </View>
      <View style={[a.px_xl, a.pb_lg]}>
        <View style={[a.gap_xs, {marginLeft: GROUP_CONTENT_INDENT}]}>
          {visibleChildren.map(child => (
            <StandardSiteCompactDocumentCard
              key={child.key}
              view={child.view}
            />
          ))}
          {canExpand && (
            <Button
              testID={`activity-group-toggle-${item.group.id}`}
              label={expanded ? l`See less` : l`See more`}
              accessibilityHint=""
              color="secondary"
              size="small"
              onPress={() => setExpanded(value => !value)}
              style={a.self_start}>
              <ButtonText>{expanded ? l`See less` : l`See more`}</ButtonText>
            </Button>
          )}
        </View>
      </View>
    </View>
  )
}

/**
 * Renders subscriptions from one actor as a single expandable Activity row.
 */
export function ActorSubscriptionGroupRow({
  item,
  hideTopBorder,
}: {
  item: ActivityGroupRowItem
  hideTopBorder: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const [expanded, setExpanded] = useState(false)
  const actorDid = item.group.actor
  const actor = actorDid ? item.actors[actorDid] : undefined
  const children = item.group.items.map(activity => ({
    key: activity.record.uri,
    activity,
    view: createSafeActivitySubjectView({
      uri: getSubscribedPublicationUri(activity, item.associatedRecords),
      associatedRecords: item.associatedRecords,
      actors: item.actors,
    }),
  }))
  const visibleChildren = expanded ? children : children.slice(0, 2)
  const canExpand = children.length > 2

  return (
    <View style={[!hideTopBorder && a.border_t, t.atoms.border_contrast_low]}>
      <View style={[a.flex_row, a.align_start, a.gap_md, a.px_xl, a.pt_lg]}>
        <UserAvatar
          avatar={actor?.avatar ?? null}
          size={GROUP_AVATAR_SIZE}
          type="user"
        />
        <View style={[a.flex_1, a.gap_sm]}>
          <Text style={[a.text_md, a.leading_snug]} emoji>
            <Trans>
              <ActorLink
                actor={actor}
                did={actorDid}
                unknown={l`Unknown user`}
              />{' '}
              subscribed to{' '}
              <Plural
                value={item.group.items.length}
                one="# publication"
                other="# publications"
              />
            </Trans>
            <TimeElapsed timestamp={item.group.indexedAt}>
              {({timeElapsed}) => (
                <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                  {' · '}
                  {timeElapsed}
                </Text>
              )}
            </TimeElapsed>
          </Text>
        </View>
      </View>
      <View style={[a.px_xl, a.pb_lg]}>
        <View style={[a.gap_xs, {marginLeft: GROUP_CONTENT_INDENT}]}>
          {visibleChildren.map(child => (
            <SubscriptionGroupChild
              key={child.key}
              activity={child.activity}
              view={child.view}
              group={item}
            />
          ))}
          {canExpand && (
            <Button
              testID={`activity-group-toggle-${item.group.id}`}
              label={expanded ? l`See less` : l`See more`}
              accessibilityHint=""
              color="secondary"
              size="small"
              onPress={() => setExpanded(value => !value)}
              style={a.self_start}>
              <ButtonText>{expanded ? l`See less` : l`See more`}</ButtonText>
            </Button>
          )}
        </View>
      </View>
    </View>
  )
}

function SubscriptionGroupChild({
  activity,
  view,
  group,
}: {
  activity: ActivityGroupRowItem['group']['items'][number]
  view: app.bsky.embed.external.ViewExternal | undefined
  group: ActivityGroupRowItem
}) {
  if (view) return <ActivityPublicationCard view={view} />

  // Keep malformed sidecars visible rather than silently dropping a child.
  return (
    <ActivityRow
      item={createGroupedActivityRowItem(group, activity)}
      hideTopBorder
    />
  )
}

function SubjectActivityGroupRow({
  item,
  hideTopBorder,
}: {
  item: ActivityGroupRowItem
  hideTopBorder: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const [expanded, setExpanded] = useState(false)
  const children = item.group.items.map(activity => {
    const row = createGroupedActivityRowItem(item, activity)
    return {row, content: getActivityRowContent(row)}
  })
  const primary = children[0]?.content
  const primaryLabel = getActorLabel(
    primary?.actor,
    primary?.actorDid,
    l`Unknown user`,
  )
  const profiles = uniqueActors(
    children.map(child => child.content.actor),
  ).filter(actor => actor.did !== primary?.actorDid)
  const otherCount = Math.max(0, item.group.items.length - 1)
  const subjectView = createActivitySubjectView({
    uri: item.group.subject,
    associatedRecords: item.associatedRecords,
    actors: item.actors,
  })

  return (
    <View style={[!hideTopBorder && a.border_t, t.atoms.border_contrast_low]}>
      <Pressable
        accessibilityLabel={
          expanded ? l`Collapse grouped activity` : l`Expand grouped activity`
        }
        accessibilityHint=""
        accessibilityRole="button"
        accessibilityState={{expanded}}
        onPress={() => setExpanded(value => !value)}
        style={[a.flex_row, a.align_start, a.gap_md, a.px_xl, a.py_lg]}>
        <UserAvatar
          avatar={primary?.actor?.avatar ?? null}
          size={GROUP_AVATAR_SIZE}
          type="user"
        />
        <View style={[a.flex_1, a.gap_sm]}>
          <Text style={[a.text_md, a.leading_snug]} emoji>
            <Text style={[a.text_md, a.leading_snug, a.font_semi_bold]} emoji>
              {primaryLabel}
            </Text>{' '}
            <Trans>
              and{' '}
              <Text style={[a.text_md, a.leading_snug, a.font_semi_bold]} emoji>
                <Plural value={otherCount} one="# other" other="# others" />
              </Text>{' '}
            </Trans>
            <SubjectGroupAction content={primary} />
            <TimeElapsed timestamp={item.group.indexedAt}>
              {({timeElapsed}) => (
                <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                  {' '}
                  · {timeElapsed}
                </Text>
              )}
            </TimeElapsed>
          </Text>
          {expanded ? (
            <View style={[a.gap_sm]}>
              {children.slice(1).map(({row, content}) => (
                <View
                  key={row.key}
                  style={[a.flex_row, a.align_center, a.gap_sm]}>
                  <UserAvatar
                    avatar={content.actor?.avatar ?? null}
                    size={GROUPED_ACTIVITY_ACTOR_SIZE}
                    type="user"
                  />
                  <Text style={[a.text_sm, a.font_semi_bold]} emoji>
                    {getActorLabel(
                      content.actor,
                      content.actorDid,
                      l`Unknown user`,
                    )}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <AvatarStack
              profiles={profiles.slice(0, 3) as bsky.profile.AnyProfileView[]}
              numPending={Math.min(otherCount, 3)}
              size={GROUPED_ACTIVITY_ACTOR_SIZE}
            />
          )}
        </View>
      </Pressable>
      {subjectView && (
        <View style={[a.px_xl, a.pb_lg, {marginLeft: GROUP_CONTENT_INDENT}]}>
          <ActivitySubject view={subjectView} />
        </View>
      )}
    </View>
  )
}

function createSafeActivitySubjectView({
  uri,
  associatedRecords,
  actors,
}: {
  uri: string | undefined
  associatedRecords: ActivityRowItem['associatedRecords']
  actors: ActivityRowItem['actors']
}) {
  try {
    return createActivitySubjectView({uri, associatedRecords, actors})
  } catch {
    return undefined
  }
}

function ActivitySubject({view}: {view: app.bsky.embed.external.ViewExternal}) {
  if (isStandardSitePublicationEmbed(view)) {
    return <ActivityPublicationCard view={view} />
  }

  return <StandardSiteEmbed view={view} />
}

function ActivityPublicationCard({
  view,
}: {
  view: app.bsky.embed.external.ViewExternal
}) {
  const t = useTheme()
  const theme: ssTypes.ThemeColors = {
    custom: false,
    accent: t.atoms.text.color,
    accentForeground: t.atoms.text_inverted.color,
  }
  const {accentRGB, accentForegroundRGB} = view.source?.theme || {}
  if (accentRGB && accentForegroundRGB) {
    theme.custom = true
    theme.accent = utils.rgbToHex(accentRGB.r, accentRGB.g, accentRGB.b)
    theme.accentForeground = utils.rgbToHex(
      accentForegroundRGB.r,
      accentForegroundRGB.g,
      accentForegroundRGB.b,
    )
  }
  return <PublicationCard view={view} themeColors={theme} />
}

function SubjectGroupAction({content}: {content?: ActivityRowContent}) {
  const {t: l} = useLingui()
  const emphasis = [a.text_md, a.leading_snug, a.font_semi_bold]

  if (content?.type === 'subscription') {
    return (
      <Trans>
        subscribed to{' '}
        <Text style={emphasis} emoji>
          {content.name || l`Untitled publication`}
        </Text>
      </Trans>
    )
  }
  if (content?.type === 'recommendation') {
    const author = getActorLabel(
      content.subjectActor,
      content.subjectDid,
      l`Unknown user`,
    )
    return (
      <Trans>
        recommended{' '}
        <Text style={emphasis} emoji>
          {author}
        </Text>
        ’s post{' '}
        <Text style={emphasis} emoji>
          {content.title || l`Untitled post`}
        </Text>
      </Trans>
    )
  }
  return <Trans>interacted with the same content</Trans>
}

function createGroupedActivityRowItem(
  group: ActivityGroupRowItem,
  activity: ActivityGroupRowItem['group']['items'][number],
): ActivityRowItem {
  return {
    type: 'activity',
    key: activity.record.uri,
    activity,
    associatedRecords: group.associatedRecords,
    actors: group.actors,
  }
}

function uniqueActors(actors: Array<ActivityActor | undefined>) {
  const seen = new Set<string>()
  return actors.filter((actor): actor is ActivityActor => {
    if (!actor || seen.has(actor.did)) return false
    seen.add(actor.did)
    return true
  })
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
    case 'group':
      return <ActivityGroupRow item={item} hideTopBorder={index === 0} />
  }
}

function getActorLabel(
  actor: ActivityActor | undefined,
  did: string | undefined,
  unknown: string,
) {
  return actor?.handle ? sanitizeHandle(actor.handle, '@') : did || unknown
}

const keyExtractor = (item: ActivityListItem) => item.key
