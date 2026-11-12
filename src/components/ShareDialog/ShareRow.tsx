import {useState} from 'react'
import {ScrollView, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, tokens, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogContext} from '#/components/Dialog'
import {type Props as SVGIconProps} from '#/components/icons/common'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {type ShareContent, type SharePlatformId} from './catalog'
import {SHEET_GUTTER} from './const'
import {hasPasteFallback, needsPaste, openSharePlatform} from './share'
import {SharePlatformIcon, useSharePlatformLabel} from './SharePlatformIcon'

/**
 * The tile's circle. The icons and logos inside are sized on their own, so
 * this only changes the padding around them.
 */
const ICON_SIZE = 52
const ACTION_ICON_SIZE = 25
const MIN_ITEM_WIDTH = 64
const GAP = tokens.space.sm
/**
 * Tiles per screen width. The half tile at the edge reads as "swipe for more"
 * instead of a clipped item, and both rows share it so they line up.
 */
const COLUMNS = 4.5
/**
 * How long the "paste it" toast stays up after the sheet closes, before the
 * app opens. Long enough to read; once the app is open, Bluesky is in the
 * background and the toast can't be seen.
 */
const PASTE_HINT_MS = 800

/**
 * A non-platform item in the row, e.g. "Copy link", drawn as a neutral tile.
 */
export type ShareAction = {
  id: string
  label: string
  /** Read by screen readers instead of `label`, e.g. to describe a toggle. */
  accessibilityLabel?: string
  icon: React.ComponentType<SVGIconProps>
  /** Tints the tile and icon blue, for a toggle that's on. */
  active?: boolean
  /** Keeps the sheet open, so a toggle can show its new state. */
  stayOpen?: boolean
  /** Runs after the sheet has closed, unless `stayOpen`. */
  onPress: () => void
}

/**
 * The width of one tile, so `COLUMNS` tiles fill the row from the left gutter
 * to the right edge, with a gap after each full tile.
 */
function getItemWidth(rowWidth: number) {
  const available = rowWidth - SHEET_GUTTER - GAP * Math.floor(COLUMNS)
  return Math.max(MIN_ITEM_WIDTH, available / COLUMNS)
}

/**
 * Two rows: the apps to share a post to, then neutral actions like "Copy
 * link". Each scrolls edge to edge, so this sits directly in the sheet's
 * padded content.
 */
export function ShareRow({
  platformIds,
  actions = [],
  content,
  uri,
  authorDid,
  onShare,
}: {
  /** Which platforms to show, in order. Usually the installed ones. */
  platformIds: readonly SharePlatformId[]
  /** Actions shown in the second row, under the platforms. */
  actions?: ShareAction[]
  /** What to fill in when an app opens. */
  content: ShareContent
  /** The post's AT URI, for metrics. */
  uri: string
  authorDid: string
  /** Runs when an app is picked, after it's logged. */
  onShare: () => void
}) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const control = useDialogContext()
  const [itemWidth, setItemWidth] = useState(MIN_ITEM_WIDTH)

  const onPressPlatform = (
    id: SharePlatformId,
    label: string,
    position: number,
  ) => {
    ax.metric('share:press:platform', {
      uri,
      authorDid,
      platform: id,
      position,
    })
    const onOpenFailed = () => {
      ax.metric('share:platform:openFailed', {
        uri,
        authorDid,
        platform: id,
      })
      Toast.show(l`Couldn’t open ${label}`, {type: 'error'})
    }
    const showPasteHint = () => {
      Toast.show(l`Link copied – paste it in ${label}`, {type: 'success'})
    }
    const openWithPaste = () => {
      openSharePlatform(id, content, {paste: true}).catch(onOpenFailed)
    }
    const open = () => {
      openSharePlatform(id, content).catch(() => {
        if (!hasPasteFallback(id)) return onOpenFailed()
        // The share link didn't open, so we're still here to show the hint
        showPasteHint()
        setTimeout(openWithPaste, PASTE_HINT_MS)
      })
    }
    if (needsPaste(id)) {
      showPasteHint()
      control.close(() => setTimeout(openWithPaste, PASTE_HINT_MS))
    } else {
      control.close(open)
    }
    onShare()
  }

  const onPressAction = (action: ShareAction) => {
    if (action.stayOpen) {
      action.onPress()
    } else {
      control.close(action.onPress)
    }
  }

  return (
    <View
      style={[
        a.relative,
        a.gap_lg,
        a.pb_md,
        {marginHorizontal: SHEET_GUTTER * -1},
      ]}
      onLayout={e => setItemWidth(getItemWidth(e.nativeEvent.layout.width))}>
      {platformIds.length > 0 && (
        <TileRow>
          {platformIds.map((id, index) => (
            <SharePlatformButton
              key={id}
              id={id}
              width={itemWidth}
              onPress={label => onPressPlatform(id, label, index)}
            />
          ))}
        </TileRow>
      )}
      <TileRow>
        {actions.map(action => (
          <ShareActionButton
            key={action.id}
            action={action}
            width={itemWidth}
            onPress={() => onPressAction(action)}
          />
        ))}
      </TileRow>
    </View>
  )
}

function TileRow({children}: {children: React.ReactNode}) {
  return (
    <ScrollView
      horizontal
      style={[a.pt_2xs]}
      contentContainerStyle={[{gap: GAP, paddingHorizontal: SHEET_GUTTER}]}
      showsHorizontalScrollIndicator={false}
      // A row that fits stays put instead of rubber-banding
      alwaysBounceHorizontal={false}
      nestedScrollEnabled>
      {children}
    </ScrollView>
  )
}

function ShareActionButton({
  action,
  width,
  onPress,
}: {
  action: ShareAction
  width: number
  onPress: () => void
}) {
  const t = useTheme()
  const Icon = action.icon

  return (
    <Button
      testID={`shareAction-${action.id}`}
      label={action.accessibilityLabel ?? action.label}
      onPress={onPress}
      style={[a.flex_col, a.gap_xs, a.justify_start, a.align_center, {width}]}>
      {({pressed}) => (
        <>
          <View
            style={[
              a.align_center,
              a.justify_center,
              a.rounded_full,
              action.active
                ? {
                    backgroundColor: pressed
                      ? t.palette.primary_100
                      : t.palette.primary_50,
                  }
                : pressed
                  ? t.atoms.bg_contrast_100
                  : t.atoms.bg_contrast_50,
              {width: ICON_SIZE, height: ICON_SIZE},
            ]}>
            <Icon
              width={ACTION_ICON_SIZE}
              fill={action.active ? t.palette.primary_500 : t.atoms.text.color}
            />
          </View>
          <TileLabel>{action.label}</TileLabel>
        </>
      )}
    </Button>
  )
}

function SharePlatformButton({
  id,
  width,
  onPress,
}: {
  id: SharePlatformId
  width: number
  onPress: (label: string) => void
}) {
  const {t: l} = useLingui()
  const label = useSharePlatformLabel(id)

  return (
    <Button
      testID={`sharePlatform-${id}`}
      label={l`Share to ${label}`}
      onPress={() => onPress(label)}
      style={[a.flex_col, a.gap_xs, a.justify_start, a.align_center, {width}]}>
      {({pressed}) => (
        <>
          <SharePlatformIcon id={id} size={ICON_SIZE} pressed={pressed} />
          <TileLabel>{label}</TileLabel>
        </>
      )}
    </Button>
  )
}

function TileLabel({children}: {children: string}) {
  const t = useTheme()
  return (
    <Text
      numberOfLines={1}
      style={[
        a.w_full,
        a.text_xs,
        a.leading_snug,
        a.text_center,
        t.atoms.text,
      ]}>
      {children}
    </Text>
  )
}
