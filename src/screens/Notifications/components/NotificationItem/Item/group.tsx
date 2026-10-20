import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  type AccessibilityActionEvent,
  type AccessibilityProps,
  type GestureResponderEvent,
  StyleSheet,
  View,
} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useGroupActorsQuery} from '#/state/queries/notifications/grouped'
import {
  getNotificationGroup,
  type GroupNotificationView,
  type NotificationGroup,
} from '#/state/queries/notifications/grouped/group-actors'
import {type NotificationType} from '#/state/queries/notifications/types'
import {formatCount} from '#/view/com/util/numeric/format'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {type app} from '#/lexicons'
import {fitAvatarCount, PREVIEW_AVATAR_SIZE, TOGGLE_PADDING} from './avatarRow'
import {Expandable} from './Expandable'
import {ActorList, ShowMoreActorsButton} from './profile'
import {Root, useRowBackgroundColor} from './Root'
import {useDisplayName} from './text'

type ProfileView = app.bsky.actor.defs.ProfileViewBasic

/**
 * Each kind's name in the `notifications:bundleExpand` metric. These are the
 * names the original notifications screen logs, so that expands on either
 * screen can be compared.
 */
const METRIC_NOTIFICATION_TYPES: Record<
  GroupNotificationView['type'],
  NotificationType
> = {
  like: 'post-like',
  repost: 'repost',
  likeViaRepost: 'like-via-repost',
  repostViaRepost: 'repost-via-repost',
  generatorLike: 'feedgen-like',
  follow: 'follow',
  subscribedPost: 'subscribed-post',
}

/**
 * The names a group notification's sentence needs.
 */
type GroupNames = {
  /**
   * The primary actor.
   */
  actor: ProfileView
  /**
   * The primary actor's display name, for the accessibility label.
   */
  name: string
  /**
   * The other actor, when the group is exactly two people and both resolved,
   * so the sentence can name them both. Otherwise it counts `others`.
   */
  second: ProfileView | undefined
  /**
   * The second actor's display name, when there is one.
   */
  secondName: string | undefined
  /**
   * How many people there are besides the primary actor.
   */
  others: number
}

/**
 * Whether a group is exactly two people and both resolved, so its sentence
 * names them both rather than counting "1 other".
 */
function isNamedPair(group: NotificationGroup) {
  return group.count === 2 && group.actors[1] !== undefined
}

/**
 * Who to name in a group notification's sentence: "**alice** and **bob**"
 * when the group is just the two of them, or "**alice** and **24 others**".
 * If the second person's profile didn't resolve, two people read as
 * "**alice** and **1 other**".
 */
export function useGroupNames(notification: GroupNotificationView): GroupNames {
  const group = getNotificationGroup(notification)
  const [actor, second] = group.actors
  const name = useDisplayName(actor)
  // Hooks can't be conditional, so without a second actor this is unused
  const secondName = useDisplayName(second ?? actor)
  const isPair = isNamedPair(group)

  return {
    actor,
    name,
    second: isPair ? second : undefined,
    secondName: isPair ? secondName : undefined,
    others: group.count - 1,
  }
}

type GroupExpansion = {
  isExpanded: boolean
  /**
   * Whether pressing the row toggles the group. If not, the avatar row's
   * "+N" and chevron do.
   */
  toggleOnPress: boolean
  onToggle: (event?: GestureResponderEvent) => void
}

type GroupContextValue = NotificationGroup & {
  /**
   * How the group expands, if it does.
   */
  expansion?: GroupExpansion
}

/**
 * Set by a `GroupRoot`, for `AvatarRow`.
 */
const GroupContext = createContext<GroupContextValue | undefined>(undefined)

/**
 * The root of a row about a group of people, e.g. everyone who liked a post.
 * With two or more, the row's `Item.AvatarRow` shows some of them and a
 * chevron, and the row expands to list them all beneath it. A pair whose
 * sentence names them both doesn't expand, since the list would only repeat
 * them, so it shows the other person's avatar without a chevron. With one,
 * this is a plain `Item.Root`.
 *
 * Pressing the row follows `href`, and the avatar row's "+N" and chevron
 * toggle the list. With `toggleOnPress`, pressing anywhere on the row toggles
 * it instead.
 *
 * The list sits below the row rather than inside it, so each person in it is
 * a control of their own, with their own hover, rather than part of the row.
 * Screen readers reach the row as one element, labelled `label`, then the
 * list after it. The row says whether it's expanded, and expanding and
 * collapsing are accessibility actions on it.
 */
export function GroupRoot({
  notification,
  href,
  label,
  toggleOnPress = false,
  accessibilityActions,
  onAccessibilityAction,
  onBeforePress,
  testID,
  children,
}: {
  notification: GroupNotificationView
  href: string
  /**
   * A single plain-text description of the row, for screen readers.
   */
  label: string
  /**
   * Whether pressing anywhere on the row toggles the list, rather than
   * following `href`.
   */
  toggleOnPress?: boolean
  /**
   * Further actions for screen readers, besides expanding and collapsing.
   */
  accessibilityActions?: AccessibilityProps['accessibilityActions']
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void
  onBeforePress?: () => void
  testID?: string
  /**
   * The row's header, laid out as `Item.Root` lays out its children.
   */
  children: React.ReactNode
}) {
  const group = getNotificationGroup(notification)

  if (group.count < 2 || isNamedPair(group)) {
    return (
      <GroupContext.Provider value={group}>
        <Root
          href={href}
          isRead={notification.isRead}
          label={label}
          accessibilityActions={accessibilityActions}
          onAccessibilityAction={onAccessibilityAction}
          onBeforePress={onBeforePress}
          testID={testID}>
          {children}
        </Root>
      </GroupContext.Provider>
    )
  }

  return (
    <ExpandableGroupRoot
      notification={notification}
      group={group}
      href={href}
      label={label}
      toggleOnPress={toggleOnPress}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      onBeforePress={onBeforePress}
      testID={testID}>
      {children}
    </ExpandableGroupRoot>
  )
}

function ExpandableGroupRoot({
  notification,
  group,
  href,
  label,
  toggleOnPress,
  accessibilityActions,
  onAccessibilityAction,
  onBeforePress,
  testID,
  children,
}: {
  notification: GroupNotificationView
  group: NotificationGroup
  href: string
  label: string
  toggleOnPress: boolean
  accessibilityActions?: AccessibilityProps['accessibilityActions']
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void
  onBeforePress?: () => void
  testID?: string
  children: React.ReactNode
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const haptics = useHaptics()
  const [isExpanded, setIsExpanded] = useState(false)
  const backgroundColor = useRowBackgroundColor(notification.isRead)

  const onToggle = (event?: GestureResponderEvent) => {
    // Keep the press from reaching the row, which on web would follow its link
    event?.preventDefault()
    event?.stopPropagation()
    haptics.tap()
    if (!isExpanded) {
      ax.metric('notifications:bundleExpand', {
        notificationType: METRIC_NOTIFICATION_TYPES[notification.type],
        authorCount: group.actors.length,
      })
    }
    setIsExpanded(!isExpanded)
  }

  /*
   * On Android, `expand` and `collapse` are the standard actions, so TalkBack
   * offers them as it would for a native control
   */
  const headerActions = [
    isExpanded
      ? {name: 'collapse', label: l`Collapse list of users`}
      : {name: 'expand', label: l`Expand list of users`},
    ...(accessibilityActions ?? []),
  ]

  return (
    <GroupContext.Provider
      value={{...group, expansion: {isExpanded, toggleOnPress, onToggle}}}>
      {/* Carries the row's unread tint down behind the list */}
      <View style={{backgroundColor}}>
        <Root
          href={href}
          isRead={notification.isRead}
          label={label}
          hint={
            toggleOnPress
              ? isExpanded
                ? l`Collapses list of users`
                : l`Expands list of users`
              : undefined
          }
          accessibilityRole={toggleOnPress ? 'button' : 'link'}
          expanded={isExpanded}
          accessibilityActions={headerActions}
          onAccessibilityAction={event => {
            const {actionName} = event.nativeEvent
            if (actionName === 'expand' || actionName === 'collapse') {
              onToggle()
            } else {
              onAccessibilityAction?.(event)
            }
          }}
          onBeforePress={onBeforePress}
          onPress={toggleOnPress ? onToggle : undefined}
          testID={testID}>
          {children}
        </Root>
        <Expandable expanded={isExpanded}>
          <GroupActorList notification={notification} group={group} />
        </Expandable>
      </View>
    </GroupContext.Provider>
  )
}

/**
 * The expanded list of a group: everyone it resolved, then any loaded since
 * with "Show more", which shows while there are more to load. Loaded actors
 * stay in the query cache, so they're still there if the list is collapsed
 * and expanded again.
 */
function GroupActorList({
  notification,
  group,
}: {
  notification: GroupNotificationView
  group: NotificationGroup
}) {
  const {t: l} = useLingui()
  const {actors, hasMore, isFetching, fetchNextPage} = useGroupActorsQuery({
    notificationId: notification.id,
    group,
  })

  const onShowMore = async () => {
    const {error} = await fetchNextPage()
    if (!error) return
    if (!isNetworkError(error)) {
      logger.error('Failed to load more notification actors', {
        safeMessage: error,
      })
    }
    Toast.show(l`Couldn’t load more accounts, please try again`, {
      type: 'error',
    })
  }

  return (
    <View style={[a.pb_xs]}>
      <ActorList
        actors={[...group.actors, ...actors]}
        starterPack={
          notification.type === 'follow' ? notification.starterPack : undefined
        }>
        {hasMore && (
          <ShowMoreActorsButton
            isLoading={isFetching}
            onPress={() => void onShowMore()}
          />
        )}
      </ActorList>
    </View>
  )
}

/**
 * Small avatars of the other people in a `GroupRoot`, i.e. the "24 others"
 * in "**alice** and **24 others** liked your post". Sits above the primary
 * sentence and leaves out the primary actor, who already has `Item.Avatar`.
 * Renders nothing in a row about one person.
 *
 * Shows as many avatars as fit the row's width, each linking to its profile.
 * Then, if the group expands, a "+N" chip for everyone else and a chevron
 * saying whether it's expanded. The group may have resolved fewer profiles
 * than it has people, in which case the avatars run out early and the chip
 * counts the rest.
 */
export function AvatarRow() {
  const moderationOpts = useModerationOpts()
  const group = useContext(GroupContext)
  const rowRef = useRef<React.ComponentRef<typeof View>>(null)
  const [width, setWidth] = useState<number>()

  /*
   * Measured in a layout effect, whose update renders again before the first
   * frame is drawn, so the row never shows a count that doesn't fit. The
   * row's width is the column's, whatever it holds. `onLayout` keeps up with
   * later changes, e.g. rotating or resizing the window.
   */
  useLayoutEffect(() => {
    const rect = rowRef.current?.getBoundingClientRect()
    if (rect) setWidth(rect.width)
  }, [])

  if (!group || group.count < 2) return null

  // The primary actor comes first, and has their own avatar
  const others = group.actors.slice(1)
  const count =
    width === undefined
      ? 0
      : fitAvatarCount({
          width,
          resolved: others.length,
          total: group.count - 1,
          hasToggle: !!group.expansion,
        })
  const shown = others.slice(0, count)
  const remaining = Math.max(group.count - 1 - shown.length, 0)

  return (
    <View
      ref={rowRef}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={[a.flex_row, a.align_center, a.gap_sm]}>
      {shown.map(profile => (
        <PreviewableUserAvatar
          key={profile.did}
          size={PREVIEW_AVATAR_SIZE}
          profile={profile}
          // Too small for it, and notifications only show the red ring
          hideLiveBadge
          moderation={
            moderationOpts
              ? moderateProfile(profile, moderationOpts).ui('avatar')
              : undefined
          }
          type={profile.associated?.labeler ? 'labeler' : 'user'}
        />
      ))}
      {group.expansion && (
        <GroupToggle expansion={group.expansion} remaining={remaining} />
      )}
    </View>
  )
}

/**
 * The end of an `AvatarRow`: a "+N" chip for anyone it didn't show, and the
 * chevron. Unless pressing the row toggles the group already, they're a
 * button that does, with some slop around them. On native, screen readers
 * don't reach it inside the row's header, which they can expand instead.
 */
function GroupToggle({
  expansion,
  remaining,
}: {
  expansion: GroupExpansion
  remaining: number
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {isExpanded, toggleOnPress, onToggle} = expansion

  const style = [
    a.flex_row,
    a.align_center,
    a.gap_xs,
    a.rounded_full,
    {height: PREVIEW_AVATAR_SIZE, paddingRight: TOGGLE_PADDING},
    // A chevron on its own is padded to a circle
    remaining === 0 && {paddingLeft: TOGGLE_PADDING},
  ]
  const contents = (
    <>
      {remaining > 0 && <OverflowChip count={remaining} />}
      <ExpandChevron expanded={isExpanded} />
    </>
  )

  if (toggleOnPress) {
    return <View style={style}>{contents}</View>
  }

  return (
    <Button
      label={isExpanded ? l`Collapse list of users` : l`Expand list of users`}
      aria-expanded={isExpanded}
      hitSlop={HITSLOP_10}
      onPress={onToggle}
      style={style}
      hoverStyle={t.atoms.bg_contrast_25}>
      {contents}
    </Button>
  )
}

/**
 * The "+N" in an `AvatarRow`, sized to match the avatars.
 */
function OverflowChip({count}: {count: number}) {
  const t = useTheme()
  const {i18n} = useLingui()

  return (
    <View
      style={[
        a.align_center,
        a.justify_center,
        a.rounded_full,
        t.atoms.bg_contrast_50,
        t.atoms.border_contrast_low,
        {
          width: PREVIEW_AVATAR_SIZE,
          height: PREVIEW_AVATAR_SIZE,
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}>
      {/* Fixed size, since it has to fit inside the circle */}
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[a.text_xs, t.atoms.text_contrast_medium]}>
        {`+${formatCount(i18n, count)}`}
      </Text>
    </View>
  )
}

/**
 * Points down when the group is collapsed and up when it's expanded.
 *
 * Swaps icons rather than rotating one, since react-native-svg applies a
 * transform on the icon to its contents too, rotating the path out of view.
 */
function ExpandChevron({expanded}: {expanded: boolean}) {
  const t = useTheme()
  const Icon = expanded ? ChevronUpIcon : ChevronDownIcon
  // `sm`, which `fitAvatarCount` allows for as `CHEVRON_SIZE`
  return <Icon size="sm" style={[t.atoms.text_contrast_high]} />
}
