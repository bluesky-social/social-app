import {useState} from 'react'
import {ScrollView, View} from 'react-native'
import {moderateProfile, type ModerationOpts} from '@bsky/sdk/moderation'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {isBlockedOrBlocking, isMuted} from '#/lib/moderation/blocked-and-muted'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {type NavigationProp} from '#/lib/routes/types'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useListConvosQuery} from '#/state/queries/messages/list-conversations'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, tokens, useTheme} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button} from '#/components/Button'
import {useDialogContext} from '#/components/Dialog'
import {type ConvoWithDetails, parseConvoView} from '#/components/dms/util'
import {Message_Stroke2_Corner0_Rounded as ChatIcon} from '#/components/icons/Message'
import {ProfileBadges} from '#/components/ProfileBadges'
import {SHEET_GUTTER} from '#/components/ShareDialog/const'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {type chat} from '#/lexicons'

const WIDTH = 80
const AVATAR_SIZE = WIDTH - 8

/** The grid is 3 across, like Instagram's share sheet. */
const GRID_COLUMNS = 3
/** A multiple of the column count, so the last row is full. */
const GRID_MAX_CHATS = GRID_COLUMNS * 8
/** Avatar, gap and one line of name. */
const GRID_ITEM_HEIGHT = AVATAR_SIZE + tokens.space.sm + 16
const GRID_ROW_GAP = tokens.space.lg
/*
 * Shows two and a half rows, so the cut-off third row hints that the grid
 * scrolls.
 */
const GRID_HEIGHT = GRID_ITEM_HEIGHT * 2.5 + GRID_ROW_GAP * 2

/**
 * The grid's height for this many chats. Fewer than fill it get a shorter
 * grid, so there's no empty space under them. The share sheet pulls the
 * section below up over the grid's bottom by `space.lg`, which a full grid
 * uses to cut through its last row, so a short one leaves room for it under
 * the names.
 */
function getGridHeight(chatCount: number) {
  const rows = Math.ceil(chatCount / GRID_COLUMNS)
  const fitHeight =
    tokens.space._2xs +
    rows * GRID_ITEM_HEIGHT +
    (rows - 1) * GRID_ROW_GAP +
    tokens.space.md +
    tokens.space.lg
  return Math.min(GRID_HEIGHT, fitHeight)
}

/**
 * The viewer's most recent chats, to send the post to one in a tap. `row` is
 * a single scrolling row; `grid` is the share sheet's taller grid.
 */
export function RecentChats({
  postUri,
  authorDid,
  onBeforePress,
  layout = 'row',
}: {
  postUri: string
  authorDid: string
  onBeforePress?: () => void
  layout?: 'row' | 'grid'
}) {
  const ax = useAnalytics()
  const control = useDialogContext()
  const {currentAccount} = useSession()
  const isGrid = layout === 'grid'
  const {data} = useListConvosQuery({
    status: 'accepted',
    lockStatus: 'unlocked',
    // A few extra so muted or broken chats don't leave the grid short
    limit: isGrid ? GRID_MAX_CHATS + 6 : undefined,
  })
  const convos = data?.pages[0]?.convos
    ?.flatMap(c => {
      const convo = parseConvoView(c, currentAccount?.did)
      const primaryMember = convo?.primaryMember
      if (
        !convo ||
        !primaryMember ||
        primaryMember.handle === 'missing.invalid' ||
        convo.view.muted
      ) {
        return []
      }
      return [{convo, primaryMember}]
    })
    .slice(0, isGrid ? GRID_MAX_CHATS : 10)
  const moderationOpts = useModerationOpts()
  const navigation = useNavigation<NavigationProp>()
  /** Shows a line at the top of the grid once chats scroll under it. */
  const [isScrolled, setIsScrolled] = useState(false)
  const t = useTheme()

  const onSelectChat = (convoId: string, position: number) => {
    onBeforePress?.()
    control.close(() => {
      ax.metric('share:press:recentDm', {uri: postUri, authorDid, position})
      navigation.navigate('MessagesConversation', {
        conversation: convoId,
        embed: postUri,
      })
    })
  }

  if (!moderationOpts) return null

  const items =
    convos && convos.length > 0
      ? convos.map(({convo, primaryMember}, position) => (
          <RecentChatItem
            key={convo.view.id}
            convo={convo}
            primaryMember={primaryMember}
            onPress={() => onSelectChat(convo.view.id, position)}
            moderationOpts={moderationOpts}
            isGrid={isGrid}
          />
        ))
      : // The grid only shows placeholders while loading, not when empty
        (!isGrid || !convos) &&
        Array.from({length: isGrid ? GRID_COLUMNS * 3 : 5}, (_, i) => (
          <ConvoSkeleton key={i} isGrid={isGrid} />
        ))

  if (isGrid) {
    return (
      <View style={[a.relative, {marginHorizontal: SHEET_GUTTER * -1}]}>
        <ScrollView
          // Full height while loading, and for the empty state
          style={{
            height:
              convos && convos.length > 0
                ? getGridHeight(convos.length)
                : GRID_HEIGHT,
          }}
          contentContainerStyle={[
            a.flex_row,
            a.flex_wrap,
            a.pt_2xs,
            a.pb_md,
            {paddingHorizontal: SHEET_GUTTER, rowGap: GRID_ROW_GAP},
          ]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={e => setIsScrolled(e.nativeEvent.contentOffset.y > 0)}
          nestedScrollEnabled>
          {items}
        </ScrollView>
        {isScrolled && (
          <View
            style={[
              a.absolute,
              a.border_t,
              t.atoms.border_contrast_low,
              {top: 0, left: SHEET_GUTTER, right: SHEET_GUTTER},
            ]}
          />
        )}
        {convos && convos.length === 0 && <GridNoConvos />}
      </View>
    )
  }

  return (
    <View
      style={[a.relative, a.flex_1, {marginHorizontal: tokens.space.md * -1}]}>
      <ScrollView
        horizontal
        style={[a.flex_1, a.pt_2xs, {minHeight: 98}]}
        contentContainerStyle={[a.gap_sm, a.px_md]}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled>
        {items}
      </ScrollView>
      {convos && convos.length === 0 && <NoConvos />}
    </View>
  )
}

function RecentChatItem({
  onPress,
  moderationOpts,
  convo,
  primaryMember,
  isGrid,
}: {
  onPress: () => void
  moderationOpts: ModerationOpts
  convo: ConvoWithDetails
  primaryMember: chat.bsky.actor.defs.ProfileViewBasic
  isGrid: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()

  const primaryProfile = useProfileShadow(primaryMember)

  const moderation = moderateProfile(primaryProfile, moderationOpts)
  const name =
    convo.kind === 'group'
      ? convo.details.name
      : createSanitizedDisplayName(
          primaryProfile,
          true,
          moderation.ui('displayName'),
        )

  if (
    convo.kind === 'direct' &&
    (isBlockedOrBlocking(primaryProfile) || isMuted(primaryProfile))
  ) {
    return null
  }

  return (
    <Button
      onPress={onPress}
      label={_(msg`Send post to ${name}`)}
      style={[
        a.flex_col,
        a.gap_sm,
        a.justify_start,
        a.align_center,
        isGrid ? [a.px_xs, {width: `${100 / GRID_COLUMNS}%`}] : {width: WIDTH},
      ]}>
      {convo.kind === 'group' ? (
        <AvatarBubbles profiles={convo.members} size={AVATAR_SIZE} />
      ) : (
        <UserAvatar
          avatar={primaryProfile.avatar}
          size={AVATAR_SIZE}
          type={primaryProfile.associated?.labeler ? 'labeler' : 'user'}
          moderation={moderation.ui('avatar')}
        />
      )}
      <View style={[a.flex_row, a.align_center, a.justify_center, a.w_full]}>
        <Text
          emoji
          style={[
            a.text_xs,
            a.leading_snug,
            isGrid ? t.atoms.text : t.atoms.text_contrast_medium,
          ]}
          numberOfLines={1}>
          {name}
        </Text>
        {convo.kind === 'direct' && (
          <ProfileBadges
            profile={primaryProfile}
            size="xs"
            style={[a.pl_2xs]}
          />
        )}
      </View>
    </Button>
  )
}

function ConvoSkeleton({isGrid}: {isGrid: boolean}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_col,
        a.justify_start,
        a.align_center,
        isGrid
          ? [
              a.gap_sm,
              {width: `${100 / GRID_COLUMNS}%`, height: GRID_ITEM_HEIGHT},
            ]
          : [a.gap_xs, {width: WIDTH, height: WIDTH + 15}],
      ]}>
      <View
        style={[
          t.atoms.bg_contrast_50,
          {width: AVATAR_SIZE, height: AVATAR_SIZE},
          a.rounded_full,
        ]}
      />
      <View
        style={[
          t.atoms.bg_contrast_50,
          {width: AVATAR_SIZE, height: 10},
          a.rounded_xs,
        ]}
      />
    </View>
  )
}

/**
 * Shown in place of the grid when there are no chats yet, centered in the
 * part of the grid that's visible.
 */
function GridNoConvos() {
  const t = useTheme()

  return (
    <View
      style={[
        a.absolute,
        a.justify_center,
        a.align_center,
        a.px_2xl,
        /*
         * The visible part runs from the search bar (the gap above the grid)
         * down to the share row, which overlaps the grid's bottom edge.
         */
        {
          top: -tokens.space.xl,
          left: 0,
          right: 0,
          height: GRID_HEIGHT + tokens.space.xl - tokens.space.lg,
        },
      ]}>
      {/* The chat icon from the bottom bar */}
      <ChatIcon size="2xl" fill={t.atoms.text.color} />
      <Text
        style={[
          a.mt_xs,
          a.text_sm,
          a.font_semi_bold,
          a.text_center,
          t.atoms.text,
        ]}>
        <Trans>No chats yet</Trans>
      </Text>
    </View>
  )
}

function NoConvos() {
  const t = useTheme()

  return (
    <View
      style={[
        a.absolute,
        a.inset_0,
        a.justify_center,
        a.align_center,
        a.px_2xl,
      ]}>
      <View
        style={[a.absolute, a.inset_0, t.atoms.bg_contrast_25, {opacity: 0.5}]}
      />
      <Text
        style={[
          a.text_sm,
          t.atoms.text_contrast_high,
          a.text_center,
          a.font_semi_bold,
        ]}>
        <Trans>Start a conversation, and it will appear here.</Trans>
      </Text>
    </View>
  )
}
