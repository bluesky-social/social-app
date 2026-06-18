import {useState} from 'react'
import {type LayoutChangeEvent, View} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyGraphStarterpack} from '@atproto/api'
import {Trans} from '@lingui/react/macro'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries/index'
import {useAgent} from '#/state/session'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useTheme} from '#/alf'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {Text} from '#/components/Typography'
import * as bsky from '#/types/bsky'

// Mirrors bskyogcard/src/components/StarterPack.tsx, which renders the remote
// Open Graph PNG at a fixed 1200x630 canvas. We reproduce that layout natively
// (no external image service) and scale every dimension by `width / DESIGN_W`
// so it looks identical at any embed/dialog width, and follows the active
// accent via the gradient + mu wordmark.
const DESIGN_W = 1200
const DESIGN_H = 630
const TILE = DESIGN_H / 3 // 18-tile (6x3) avatar mosaic behind the gradient
const FACE_INNER = 172 // facepile avatar diameter (before the ring)
const FACE_RING = 15

/**
 * Native, on-brand replacement for the remote Open Graph "share card" image
 * (the old `getStarterPackOgCard` PNG from Bluesky's ogcard service). The
 * member avatars live on the full `StarterPackView` (`listItemsSample`); a feed
 * embed only has the basic view, so we fetch the full pack when the sample is
 * missing. External link unfurls are handled separately by the OG middleware
 * (services/og/bunny).
 */
export function StarterPackHero({
  starterPack,
}: {
  starterPack: bsky.starterPack.AnyStarterPackView
}) {
  const t = useTheme()
  const agent = useAgent()
  const [width, setWidth] = useState(0)

  // The avatar sample only exists on the full StarterPackView; a post/feed
  // embed is a basic view, so fetch the full pack when the sample is absent.
  // Uses a dedicated query key (not the shared starter-pack cache, which
  // `precacheStarterPack` seeds with a sample-less synthesized view), and is
  // disabled when we already have a sample so feeds don't refetch per embed.
  const hasSample =
    bsky.starterPack.isView(starterPack) &&
    (starterPack.listItemsSample?.length ?? 0) > 0
  const {data: fetched} = useQuery({
    queryKey: ['starterPackHero', starterPack.uri],
    queryFn: async () => {
      const res = await agent.app.bsky.graph.getStarterPack({
        starterPack: starterPack.uri,
      })
      return res.data.starterPack
    },
    enabled: !hasSample,
    staleTime: STALE.MINUTES.FIVE,
  })

  const view = fetched ?? starterPack

  if (
    !bsky.dangerousIsType<AppBskyGraphStarterpack.Record>(
      view.record,
      AppBskyGraphStarterpack.isRecord,
    )
  ) {
    return null
  }

  const {creator} = view
  const sample =
    fetched?.listItemsSample ??
    (bsky.starterPack.isView(starterPack)
      ? starterPack.listItemsSample
      : undefined) ??
    []

  // Unique avatar URLs (creator + sample), creator first, deduped by did.
  const byDid = new Map<string, string>()
  for (const p of [creator, ...sample.map(li => li.subject)]) {
    if (p.avatar && !byDid.has(p.did)) byDid.set(p.did, p.avatar)
  }
  const allAvatars = [...byDid.values()]

  // The across-row facepile, with the creator centered (mirrors the OG card).
  const others = [...byDid.entries()]
    .filter(([did]) => did !== creator.did)
    .map(([, avatar]) => avatar)
  const across: string[] = []
  if (creator.avatar) {
    if (others.length >= 6) {
      across.push(...others.slice(0, 3), creator.avatar, ...others.slice(3, 6))
    } else {
      const half = Math.floor(others.length / 2)
      across.push(
        ...others.slice(0, half),
        creator.avatar,
        ...others.slice(half),
      )
    }
  } else {
    across.push(...others.slice(0, 7))
  }

  const name = view.record.name
  const isLongTitle = name.length > 30
  const scale = width / DESIGN_W
  const px = (n: number) => n * scale

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(e.nativeEvent.layout.width)

  return (
    <View
      onLayout={onLayout}
      style={[
        a.w_full,
        a.aspect_card,
        a.overflow_hidden,
        {backgroundColor: t.palette.primary_500},
      ]}>
      {width > 0 ? (
        <>
          {/* Avatar mosaic background (cycles through the member avatars). */}
          {allAvatars.length > 0 ? (
            <View
              style={[
                a.absolute,
                a.flex_row,
                a.flex_wrap,
                a.justify_center,
                {
                  top: 0,
                  // Mosaic is wider than the card (6 tiles = 1260 > 1200);
                  // center it horizontally like the OG canvas.
                  left: px((DESIGN_W - TILE * 6) / 2),
                  height: px(TILE * 3),
                  width: px(TILE * 6),
                },
              ]}>
              {Array.from({length: 18}).map((_, i) => (
                <Image
                  key={i}
                  source={{uri: allAvatars[i % allAvatars.length]}}
                  style={{width: px(TILE), height: px(TILE)}}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ))}
            </View>
          ) : null}

          {/* Accent gradient overlay (tints the mosaic into a faded texture). */}
          <LinearGradientBackground
            colors={[t.palette.primary_300, t.palette.primary_600]}
            style={[a.absolute, a.inset_0, {opacity: 0.92}]}
          />

          {/* Foreground: title, facepile, name, brand. */}
          <View
            style={[
              a.absolute,
              a.inset_0,
              a.align_center,
              {paddingTop: px(56)},
            ]}>
            <Text
              style={{
                color: 'white',
                fontSize: px(40),
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: px(1),
              }}>
              <Trans>Join the conversation</Trans>
            </Text>

            {across.length > 0 ? (
              <View style={[a.flex_row, {marginTop: px(40)}]}>
                {across.map((uri, i) => (
                  <View
                    key={i}
                    style={{
                      width: px(FACE_INNER + FACE_RING * 2),
                      height: px(FACE_INNER + FACE_RING * 2),
                      marginLeft: i === 0 ? 0 : px(-FACE_RING * 2),
                      borderRadius: 9999,
                      borderWidth: px(FACE_RING),
                      borderColor: t.palette.primary_400,
                      overflow: 'hidden',
                      backgroundColor: t.palette.primary_400,
                    }}>
                    <Image
                      source={{uri}}
                      style={{width: '100%', height: '100%'}}
                      contentFit="cover"
                      accessibilityIgnoresInvertColors
                    />
                  </View>
                ))}
              </View>
            ) : null}

            <Text
              emoji
              numberOfLines={2}
              style={{
                color: 'white',
                fontSize: px(isLongTitle ? 55 : 65),
                fontWeight: '700',
                textAlign: 'center',
                marginTop: px(64),
                paddingHorizontal: px(30),
                lineHeight: px(isLongTitle ? 62 : 72),
              }}>
              {name}
            </Text>

            <View
              style={[
                a.flex_row,
                a.align_center,
                {marginTop: px(28), gap: px(14)},
              ]}>
              <Text
                style={{color: 'white', fontSize: px(40), fontWeight: '700'}}>
                <Trans comment="Precedes the app logo, e.g. 'on [mu]'">
                  on
                </Trans>
              </Text>
              <Logotype width={px(118)} fill="white" />
            </View>
          </View>
        </>
      ) : null}
    </View>
  )
}
