import {useRef, useState} from 'react'
import {
  LayoutAnimation,
  Pressable,
  type ScrollView,
  useWindowDimensions,
  View,
} from 'react-native'
import {type ChatBskyActorDefs, type ChatBskyConvoDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {sanitizeHandle} from '#/lib/strings/handles'
import {type ActiveConvoStates, useConvoActive} from '#/state/messages/convo'
import {useSession} from '#/state/session'
import {type SessionAccount} from '#/state/session/types'
import {DraggableScrollView} from '#/view/com/pager/DraggableScrollView'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_NATIVE, IS_WEB} from '#/env'
import type * as bsky from '#/types/bsky'

type Reaction = {
  key: string
  value: string
  senders: ChatBskyConvoDefs.ReactionViewSender[]
  count: number
}

type Tab = Omit<Reaction, 'senders'>

export function ReactionsDialog({
  control,
  relatedProfiles,
  message,
  reactions,
  groupedReactions,
}: {
  control: Dialog.DialogControlProps
  relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>
  message: ChatBskyConvoDefs.MessageView
  reactions?: ChatBskyConvoDefs.ReactionView[]
  groupedReactions?: Reaction[]
}) {
  const {t: l} = useLingui()

  const {height: screenHeight} = useWindowDimensions()
  const {currentAccount} = useSession()
  const convo = useConvoActive()

  const [selected, setSelected] = useState('all')

  const filteredReactions = reactions?.filter(
    r => selected === 'all' || r.value === selected,
  )

  const header = (
    <>
      <View style={[a.px_2xl, IS_WEB ? [a.pt_xl, a.pb_md] : a.pt_3xl]}>
        <Text style={[a.font_bold, a.text_2xl, a.mb_sm]}>
          <Trans>Reactions</Trans>
        </Text>
      </View>
      <ReactionTabs
        groupedReactions={groupedReactions}
        selected={selected}
        totalReactions={reactions?.length ?? 0}
        onFilter={setSelected}
      />
      <Dialog.Close />
    </>
  )

  return (
    <Dialog.Outer
      control={control}
      onClose={() => setSelected('all')}
      nativeOptions={{
        preventExpansion: true,
        minHeight: screenHeight / 2,
        maxHeight: screenHeight / 2,
      }}>
      <Dialog.Handle />
      {IS_NATIVE ? header : null}
      <Dialog.ScrollableInner
        label={l`Reactions`}
        contentContainerStyle={[a.pt_0]}
        header={IS_WEB ? header : null}
        style={[web({maxWidth: 400})]}>
        {filteredReactions
          ?.sort((a, b) => {
            if (a.sender.did === currentAccount?.did) return -1
            if (b.sender.did === currentAccount?.did) return 1
            return 0
          })
          .map(reaction => {
            const sender = relatedProfiles.get(reaction.sender.did)
            if (!sender) return null
            return (
              <ReactionRow
                key={reaction.sender.did + '-' + reaction.value}
                control={control}
                convo={convo}
                currentAccount={currentAccount}
                message={message}
                profile={sender}
                reaction={reaction}
                allReactions={reactions ?? []}
                selected={selected}
                setSelected={setSelected}
              />
            )
          })}
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function ReactionRow({
  control,
  convo,
  currentAccount,
  message,
  profile,
  reaction,
  allReactions,
  selected,
  setSelected,
}: {
  control: Dialog.DialogControlProps
  convo: ActiveConvoStates
  currentAccount?: SessionAccount
  message: ChatBskyConvoDefs.MessageView
  profile: bsky.profile.AnyProfileView
  reaction: ChatBskyConvoDefs.ReactionView
  allReactions: ChatBskyConvoDefs.ReactionView[]
  selected: string
  setSelected: React.Dispatch<React.SetStateAction<string>>
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const isFromSelf = currentAccount?.did === profile.did

  const displayName = createSanitizedDisplayName(profile, true)
  const handle = sanitizeHandle(profile.handle, '@')

  const handleOnPress = () => {
    const remainingReactions = allReactions.filter(
      r =>
        !(r.value === reaction.value && r.sender.did === currentAccount?.did),
    )

    if (remainingReactions.length === 0) {
      control.close()
    } else if (
      selected !== 'all' &&
      !remainingReactions.some(r => r.value === reaction.value)
    ) {
      // tab no longer exists
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setSelected('all')
    }

    convo
      .removeReaction(message.id, reaction.value)
      .catch(() => Toast.show(l`Failed to remove emoji reaction`))
  }

  const inner = (
    <>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <UserAvatar
          avatar={profile.avatar}
          size={42}
          type="user"
          hideLiveBadge
        />
        <View>
          <Text
            numberOfLines={1}
            style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
            {displayName}
          </Text>
          <Text
            numberOfLines={1}
            style={[a.text_xs, t.atoms.text_contrast_medium, web([a.mt_xs])]}>
            {isFromSelf ? l`Tap to remove` : handle}
          </Text>
        </View>
      </View>
      <View>
        <Text style={[a.text_5xl, {includeFontPadding: false}]} emoji>
          {reaction.value}
        </Text>
      </View>
    </>
  )

  if (isFromSelf) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint={l`Tap to remove your ${reaction.value} reaction`}
        style={[
          a.flex_row,
          a.align_center,
          a.gap_sm,
          a.justify_between,
          a.my_sm,
        ]}
        onPress={handleOnPress}>
        {inner}
      </Pressable>
    )
  }

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.justify_between,
        a.my_sm,
      ]}>
      {inner}
    </View>
  )
}

function ReactionTabs({
  groupedReactions,
  selected,
  totalReactions,
  onFilter,
}: {
  groupedReactions?: Reaction[]
  selected: string
  totalReactions: number
  onFilter: (value: string) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const scrollViewRef = useRef<ScrollView>(null)
  const scrollState = useRef({x: 0, width: 0})
  const tabLayouts = useRef<Map<string, {x: number; width: number}>>(new Map())

  const handlePress = (value: string) => {
    onFilter(value)

    // Scroll a partially-visible tab fully into view.
    const layout = tabLayouts.current.get(value)
    if (layout && scrollViewRef.current && scrollState.current.width > 0) {
      const tabLeft = layout.x
      const tabRight = layout.x + layout.width
      const viewLeft = scrollState.current.x
      const viewRight = viewLeft + scrollState.current.width

      if (tabLeft < viewLeft) {
        scrollViewRef.current.scrollTo({
          x: Math.max(0, tabLeft - 24),
          animated: true,
        })
      } else if (tabRight > viewRight) {
        scrollViewRef.current.scrollTo({
          x: tabRight - scrollState.current.width + 24,
          animated: true,
        })
      }
    }
  }

  const handleTabLayout = (key: string, layout: {x: number; width: number}) => {
    tabLayouts.current.set(key, layout)
  }

  const tabs: Tab[] = [
    {key: 'all', value: l`All`, count: totalReactions},
    ...(groupedReactions ?? []),
  ]

  return (
    <View accessibilityRole="tablist" style={[t.atoms.bg]}>
      <DraggableScrollView
        ref={scrollViewRef}
        horizontal={true}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        onScroll={e => {
          scrollState.current = {
            x: e.nativeEvent.contentOffset.x,
            width: e.nativeEvent.layoutMeasurement.width,
          }
        }}
        onLayout={e => {
          scrollState.current.width = e.nativeEvent.layout.width
        }}>
        <View
          style={[
            a.flex_row,
            a.flex_grow,
            a.gap_sm,
            a.align_center,
            a.justify_start,
          ]}>
          {tabs.map((tab, index) => (
            <ReactionTab
              key={tab.key}
              index={index}
              tab={tab}
              selected={selected}
              total={tabs.length}
              onPress={handlePress}
              onTabLayout={handleTabLayout}
            />
          ))}
        </View>
      </DraggableScrollView>
    </View>
  )
}

function ReactionTab({
  index,
  tab,
  selected,
  total,
  onPress,
  onTabLayout,
}: {
  index: number
  tab: Tab
  selected: string
  total: number
  onPress: (value: string) => void
  onTabLayout: (key: string, layout: {x: number; width: number}) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{selected: selected === tab.key}}
      accessibilityHint={
        tab.key === 'all'
          ? l`Tap to show all reactions`
          : l`Tap to show ${tab.value} reactions`
      }
      hitSlop={HITSLOP_10}
      style={[
        a.flex_row,
        a.align_center,
        a.border,
        a.justify_center,
        a.rounded_lg,
        a.px_md,
        a.py_sm,
        a.mb_sm,
        selected === tab.key
          ? t.atoms.border_contrast_low
          : {borderColor: t.palette.contrast_50},
        selected === tab.key ? t.atoms.bg_contrast_50 : t.atoms.bg,
        index === 0 ? a.ml_2xl : index === total - 1 ? a.mr_2xl : null,
      ]}
      onLayout={e => {
        onTabLayout(tab.key, {
          x: e.nativeEvent.layout.x,
          width: e.nativeEvent.layout.width,
        })
      }}
      onPress={() => onPress(tab.key)}>
      <Text emoji style={[a.text_sm]}>
        {tab.key === 'all'
          ? l({
              message: `All ${tab.count}`,
              comment:
                'Tab label showing the total count of reactions on a chat message.',
            })
          : `${tab.value} ${tab.count}`}
      </Text>
    </Pressable>
  )
}
