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
import {useOpenLink} from '#/lib/hooks/useOpenLink'
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
import {IS_NATIVE} from '#/env'
import {type app} from '#/lexicons'
import {logProfileLinkChanges} from '../metrics'
import {PILL_LEFT, PILL_RIGHT_TEXT, PILL_VERTICAL} from '../pillSize'
import {getLinkHost, getSupportProvider} from '../providers'
import {buildProfileRow, GERM_KEY} from '../row'
import {
  useCanEditProfileLinks,
  useOwnProfileLinksQuery,
  useProfileLinksEnabled,
  useProfileViewLinks,
  useSaveProfileLinksMutation,
} from '../state'
import {type ProfileLink} from '../types'
import {LinkFormDialog} from './LinkFormDialog'
import {LinkHoverPreview} from './LinkHoverPreview'
import {ProfileLinkPill} from './LinkPill'
import {LinkPreviewSheet} from './LinkPreviewSheet'

/** The row shows at most this many lines before folding into "+N". */
const MAX_ROWS = 2
const GAP = 8
/** Until the "+N" pill has been measured, assume roughly this wide. */
const MORE_PILL_GUESS = 48
const EASE_OUT = Easing.out(Easing.cubic)

/**
 * The row of link pills under the bio, followed by the Germ DM button. Hidden
 * whenever moderation hides the bio.
 *
 * Visitors open a link with a tap and see where it goes on hover or long
 * press. The owner taps a link to edit it.
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
  const canEdit = useCanEditProfileLinks()
  const isOwnProfile = currentAccount?.did === profile.did
  /*
   * The owner's row comes from their repo: it reflects a save before the
   * AppView catches up, and editing needs the stored icon blobs.
   */
  const viewLinks = useProfileViewLinks(profile)
  const {data: ownLinks} = useOwnProfileLinksQuery(profile.did, {
    enabled: enabled && !hidden && isOwnProfile,
  })
  const links =
    !enabled || hidden ? [] : isOwnProfile ? (ownLinks ?? []) : viewLinks
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
      germButton={germButton}
      isOwnProfile={isOwnProfile}
      canEdit={isOwnProfile && canEdit}
    />
  )
}

function ProfileLinksRow({
  profile,
  links,
  germButton,
  isOwnProfile,
  canEdit,
}: {
  profile: app.bsky.actor.defs.ProfileViewDetailed
  links: ProfileLink[]
  germButton?: React.ReactElement
  isOwnProfile: boolean
  /** The owner taps a link to edit it, instead of opening it. */
  canEdit: boolean
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {tap: playTapHaptic, longPress: playLongPressHaptic} = useHaptics()
  const openLink = useOpenLink()
  const previewControl = useDialogControl()
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

  const open = (link: ProfileLink) => {
    ax.metric('profile:links:click', {
      domain: getLinkHost(link.url),
      supportProvider: getSupportProvider(link.url)?.name,
      isOwnProfile,
    })
    // through the redirect service, so Safelink rules apply
    openLink(link.url, undefined, true)
  }

  const showPreview = (link: ProfileLink) => {
    ax.metric('profile:links:preview', {
      domain: getLinkHost(link.url),
      supportProvider: getSupportProvider(link.url)?.name,
    })
    setActiveLink(link)
    previewControl.open()
  }

  const saveLinks = async (next: ProfileLink[]) => {
    try {
      await save(profile, next, links)
      logProfileLinkChanges(ax, links, next)
    } catch (e) {
      if (!isNetworkError(e)) {
        logger.error('Failed to save profile links', {safeMessage: e})
      }
      Toast.show(l`Couldn’t save your links. Please try again.`, {
        type: 'error',
      })
    }
  }

  const items = buildProfileRow(links, !!germButton).map(item => {
    if (item.type === 'germ') {
      return {key: GERM_KEY, node: germButton}
    }
    const {link} = item
    const index = links.indexOf(link)
    return {
      key: item.key,
      node: canEdit ? (
        <ProfileLinkPill
          link={link}
          did={profile.did}
          label={l`Edit link`}
          onPress={() => {
            playTapHaptic()
            setEditingIndex(index)
            formControl.open()
          }}
        />
      ) : (
        <LinkHoverPreview url={link.url}>
          <ProfileLinkPill
            link={link}
            did={profile.did}
            arrow
            hint={l`Opens ${getLinkHost(link.url)} outside Bluesky`}
            onPress={() => {
              playTapHaptic()
              open(link)
            }}
            onLongPress={
              IS_NATIVE
                ? () => {
                    playLongPressHaptic()
                    showPreview(link)
                  }
                : undefined
            }
            a11yActions={{
              accessibilityActions: [
                {name: 'showDetails', label: l`Show link details`},
              ],
              onAccessibilityAction: event => {
                if (event.nativeEvent.actionName === 'showDetails') {
                  showPreview(link)
                }
              },
            }}
          />
        </LinkHoverPreview>
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
      {canEdit ? (
        <LinkFormDialog
          control={formControl}
          link={editingIndex === null ? null : links[editingIndex]}
          existingUrls={links
            .filter((_, i) => i !== editingIndex)
            .map(link => link.url)}
          onSave={saved => {
            if (editingIndex === null) return
            void saveLinks(
              links.map((link, i) => (i === editingIndex ? saved : link)),
            )
          }}
          onRemove={() => {
            if (editingIndex === null) return
            void saveLinks(links.filter((_, i) => i !== editingIndex))
          }}
        />
      ) : (
        <>
          <LinkPreviewSheet
            control={previewControl}
            link={activeLink}
            onOpen={open}
            onReport={
              // nothing to report on your own profile
              !isOwnProfile && activeLink?.uri && activeLink.cid
                ? () => reportControl.open()
                : undefined
            }
          />
          {activeLink?.uri && activeLink.cid ? (
            <ReportDialog
              control={reportControl}
              // the link was read off a profile view, so these are well-formed
              subject={{
                $type: 'app.bsky.actor.defs#profileLinkView',
                uri: activeLink.uri as app.bsky.actor.defs.ProfileLinkView['uri'],
                cid: activeLink.cid,
                url: activeLink.url as app.bsky.actor.defs.ProfileLinkView['url'],
              }}
            />
          ) : null}
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
