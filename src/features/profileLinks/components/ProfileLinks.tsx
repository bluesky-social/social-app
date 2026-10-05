import {useCallback, useEffect, useState} from 'react'
import {type LayoutChangeEvent, View} from 'react-native'
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {useHaptics} from '#/lib/haptics'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {
  ReportDialog,
  useReportDialogControl,
} from '#/components/moderation/ReportDialog'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {type app} from '#/lexicons'
import {logProfileLinkChanges} from '../metrics'
import {PILL_LEFT, PILL_RIGHT_TEXT, PILL_VERTICAL} from '../pillSize'
import {getLinkHost, getSupportProvider} from '../providers'
import {type ProfileLinksData} from '../record'
import {buildProfileRow, GERM_KEY, removeLinkAt} from '../row'
import {
  useProfileLinksEnabled,
  useProfileLinksQuery,
  useSaveProfileLinksMutation,
} from '../state'
import {type ProfileLink} from '../types'
import {LinkFormDialog} from './LinkFormDialog'
import {LinkInterstitial} from './LinkInterstitial'
import {ProfileLinkPill} from './LinkPill'

/** The row shows at most this many lines before folding into "+N". */
const MAX_ROWS = 2
const GAP = 8
/** Until the "+N" pill has been measured, assume roughly this wide. */
const MORE_PILL_GUESS = 48
const EASE_OUT = Easing.out(Easing.cubic)

/**
 * The row of link pills under the bio, with the Germ DM button slotted in at
 * the owner's chosen position. Only shown to users in the beta, and hidden
 * whenever moderation hides the bio.
 *
 * Visitors get the leaving-Bluesky notice before a link opens. The owner taps
 * a link to edit it.
 */
export function ProfileHeaderLinks({
  profile,
  hidden,
  germButton,
}: {
  profile: app.bsky.actor.defs.ProfileViewDetailed
  hidden: boolean
  /** The Germ DM button, when this profile shows one. */
  germButton?: React.ReactElement
}) {
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const enabled = useProfileLinksEnabled()
  const {data} = useProfileLinksQuery(profile.did, {
    enabled: enabled && !hidden,
  })
  const links = enabled && !hidden ? (data?.links ?? []) : []
  const germIndex = data?.germIndex ?? 0
  const isOwnProfile = currentAccount?.did === profile.did
  const supportLinkCount = links.filter(link =>
    getSupportProvider(link.url),
  ).length

  useEffect(() => {
    if (links.length === 0) return
    ax.metric('profile:links:impression', {
      linkCount: links.length,
      supportLinkCount,
      isOwnProfile,
    })
    // Once per profile and set of links, not on every render.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.did, links.length, supportLinkCount])

  if (links.length === 0) {
    // the header is a column, so a lone button would stretch to full width
    return germButton ? <View style={[a.flex_row]}>{germButton}</View> : null
  }
  return (
    <ProfileLinksRow
      profile={profile}
      links={links}
      germIndex={germIndex}
      germButton={germButton}
      isOwnProfile={isOwnProfile}
    />
  )
}

function ProfileLinksRow({
  profile,
  links,
  germIndex,
  germButton,
  isOwnProfile,
}: {
  profile: app.bsky.actor.defs.ProfileViewDetailed
  links: ProfileLink[]
  germIndex: number
  germButton?: React.ReactElement
  isOwnProfile: boolean
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const playHaptic = useHaptics()
  const noticeControl = useDialogControl()
  const reportControl = useReportDialogControl()
  const formControl = useDialogControl()
  const {save} = useSaveProfileLinksMutation()
  const [activeLink, setActiveLink] = useState<ProfileLink | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)

  // the profile screen stays mounted elsewhere in the app, so fold back up on leave
  useFocusEffect(
    useCallback(() => {
      return () => setExpanded(false)
    }, []),
  )

  const saveLinks = async (next: ProfileLinksData) => {
    try {
      await save(profile, next)
      logProfileLinkChanges(ax, links, next.links)
    } catch (e) {
      if (!isNetworkError(e)) {
        logger.error('Failed to save profile links', {safeMessage: e})
      }
      Toast.show(l`Couldn’t save your links. Please try again.`, {
        type: 'error',
      })
    }
  }

  const items = buildProfileRow(links, !!germButton, germIndex).map(item => {
    if (item.type === 'germ') {
      return {key: GERM_KEY, node: germButton}
    }
    const {link} = item
    const index = links.indexOf(link)
    return {
      key: item.key,
      node: isOwnProfile ? (
        <ProfileLinkPill
          link={link}
          label={l`Edit link`}
          onPress={() => {
            playHaptic('Light')
            setEditingIndex(index)
            formControl.open()
          }}
        />
      ) : (
        <ProfileLinkPill
          link={link}
          arrow
          onPress={() => {
            playHaptic('Light')
            ax.metric('profile:links:click', {
              domain: getLinkHost(link.url),
              supportProvider: getSupportProvider(link.url)?.name,
              isOwnProfile,
            })
            setActiveLink(link)
            noticeControl.open()
          }}
        />
      ),
    }
  })

  return (
    <>
      <CappedPillRow
        items={items}
        expanded={expanded}
        onExpand={() => setExpanded(true)}
      />
      {isOwnProfile ? (
        <LinkFormDialog
          control={formControl}
          link={editingIndex === null ? null : links[editingIndex]}
          existingUrls={links
            .filter((_, i) => i !== editingIndex)
            .map(link => link.url)}
          onSave={saved => {
            if (editingIndex === null) return
            void saveLinks({
              links: links.map((link, i) =>
                i === editingIndex ? saved : link,
              ),
              germIndex,
            })
          }}
          onRemove={() => {
            if (editingIndex === null) return
            void saveLinks(removeLinkAt(links, germIndex, editingIndex))
          }}
        />
      ) : (
        <>
          <LinkInterstitial
            control={noticeControl}
            link={activeLink}
            profile={profile}
            onReport={() => reportControl.open()}
          />
          <ReportDialog
            control={reportControl}
            subject={{
              ...profile,
              $type: 'app.bsky.actor.defs#profileViewDetailed',
            }}
            profileLinkUrl={activeLink?.url}
          />
        </>
      )}
    </>
  )
}

/**
 * A wrapping row that shows at most `MAX_ROWS` lines. It measures each pill,
 * replays the wrap to see which line each lands on, and folds the rest into a
 * "+N" pill, dropping pills off the last line until that pill fits too.
 * Folded pills stay mounted out of flow so their sizes are known on expand.
 */
function CappedPillRow({
  items,
  expanded,
  onExpand,
}: {
  items: {key: string; node: React.ReactNode}[]
  expanded: boolean
  onExpand: () => void
}) {
  const [width, setWidth] = useState(0)
  const [sizes, setSizes] = useState<Record<string, number>>({})
  const [moreWidth, setMoreWidth] = useState(0)

  const measured = width > 0 && items.every(item => sizes[item.key] != null)

  // what the folded row shows; null means everything fits
  let folded: Set<string> | null = null
  if (measured) {
    const rows: string[][] = [[]]
    let x = 0
    for (const item of items) {
      const w = sizes[item.key]
      if (x > 0 && x + w > width) {
        rows.push([])
        x = 0
      }
      rows[rows.length - 1].push(item.key)
      x += w + GAP
    }
    if (rows.length > MAX_ROWS) {
      const kept = rows.slice(0, MAX_ROWS)
      const last = kept[MAX_ROWS - 1]
      const pill = moreWidth || MORE_PILL_GUESS
      const used = () => last.reduce((sum, key) => sum + sizes[key] + GAP, 0)
      while (last.length && used() + pill > width) last.pop()
      folded = new Set(kept.flat())
    }
  }
  const hiddenCount = folded && !expanded ? items.length - folded.size : 0

  const measure = (key: string) => (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    setSizes(prev => (prev[key] === w ? prev : {...prev, [key]: w}))
  }

  let revealIndex = 0
  return (
    <Animated.View
      layout={LinearTransition.duration(300).easing(EASE_OUT)}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      style={[
        a.flex_row,
        a.flex_wrap,
        a.align_center,
        {columnGap: GAP, rowGap: GAP},
        // one frame of measuring before anything shows, instead of a reflow
        !measured && {opacity: 0},
      ]}>
      {items.map(item => {
        const inFold = folded ? folded.has(item.key) : true
        if (!inFold && !expanded) {
          // a different key from the shown version, so revealing it animates in
          return (
            <View
              key={`${item.key}:measure`}
              onLayout={measure(item.key)}
              pointerEvents="none"
              style={[a.absolute, {left: 0, top: 0, opacity: 0}]}>
              {item.node}
            </View>
          )
        }
        const entering = !inFold
          ? FadeInDown.duration(320)
              .easing(EASE_OUT)
              .delay(revealIndex++ * 40)
          : undefined
        return (
          <Animated.View
            key={item.key}
            entering={entering}
            layout={LinearTransition.duration(300).easing(EASE_OUT)}
            onLayout={measure(item.key)}>
            {item.node}
          </Animated.View>
        )
      })}
      {hiddenCount > 0 ? (
        <Animated.View
          exiting={FadeOut.duration(120)}
          layout={LinearTransition.duration(300).easing(EASE_OUT)}
          onLayout={e => setMoreWidth(e.nativeEvent.layout.width)}>
          <MorePill count={hiddenCount} onPress={onExpand} />
        </Animated.View>
      ) : null}
    </Animated.View>
  )
}

function MorePill({count, onPress}: {count: number; onPress: () => void}) {
  const t = useTheme()
  return (
    <Button
      testID="profileLinksMoreBtn"
      label={plural(count, {
        one: 'Show # more link',
        other: 'Show # more links',
      })}
      size="small"
      color="secondary"
      onPress={onPress}
      style={{
        paddingVertical: PILL_VERTICAL,
        paddingLeft: PILL_LEFT,
        paddingRight: PILL_RIGHT_TEXT,
      }}>
      <ButtonText style={t.atoms.text}>+{count}</ButtonText>
    </Button>
  )
}
