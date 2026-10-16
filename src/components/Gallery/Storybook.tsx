import {useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import {type AnimatedRef} from 'react-native-reanimated'
import {Asset} from 'expo-asset'
import {Image} from 'expo-image'
import {Trans, useLingui} from '@lingui/react/macro'

import {type Dimensions} from '#/lib/media/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import * as Gallery from '#/components/Gallery'
import {Gallery as ImageGallery} from '#/components/images/Gallery'
import {useLightboxControls} from '#/components/Lightbox/state'
import {H2, H3, Text} from '#/components/Typography'
import {type app} from '#/lexicons'

/*
 * Local fixtures. `Image.resolveAssetSource` doesn't exist on web, so resolve
 * through expo-asset.
 */
/** Asset URLs are always absolute, which the lexicon type can't know */
function asUri(value: string) {
  return value as `${string}:${string}`
}

const kawaii = Asset.fromModule(require('../../../assets/kawaii.png')).uri // 1920x1080
const kawaiiSmol = Asset.fromModule(
  require('../../../assets/kawaii_smol.png'),
).uri // 246x138
const welcome = Asset.fromModule(
  require('../../../assets/images/welcome-modal-bg.jpg'),
).uri // 1432x1025

/**
 * Examples of the gallery for manual QA. Kept out of the gallery's index so
 * ordinary imports don't pull in these fixtures.
 */
export function GalleryStorybook() {
  return (
    <View style={[a.gap_3xl]} testID="galleryStorybook">
      <H2>
        <Trans>Gallery</Trans>
      </H2>
      <Text style={[a.leading_snug]}>
        <Trans>
          A horizontal strip of any content. Each item keeps its own width and
          height, and the strip is as tall as the tallest one.
        </Trans>
      </Text>
      <ImageContent />
      <ImageAdapter />
      <MixedContent />
      <InteractiveChildren />
      <ChangingContent />
      <ConstrainedAndBleeding />
      <EmptyAndSingle />
    </View>
  )
}

function Section({
  titleText,
  descriptionText,
  testID,
  children,
}: {
  titleText: React.ReactNode
  descriptionText?: React.ReactNode
  testID: string
  children: React.ReactNode
}) {
  return (
    <View style={[a.gap_md]} testID={testID}>
      <H3>{titleText}</H3>
      {descriptionText ? (
        <Text style={[a.leading_snug]}>{descriptionText}</Text>
      ) : null}
      {children}
    </View>
  )
}

function CaptionText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>{children}</Text>
  )
}

function Card({
  width,
  height,
  title,
  tone = 'primary',
}: {
  width: number
  height: number
  title: string
  tone?: 'primary' | 'positive' | 'negative'
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.rounded_md,
        a.align_center,
        a.justify_center,
        a.p_sm,
        {width, height, backgroundColor: t.palette[`${tone}_100`]},
      ]}>
      <Text style={[a.font_bold, a.text_center]}>{title}</Text>
      <Text style={[a.text_xs, a.text_center]}>
        {Math.round(width)}×{height}
      </Text>
    </View>
  )
}

function ImageFrame({
  uri,
  width,
  height,
}: {
  uri: string
  width: number
  height: number
}) {
  const t = useTheme()
  return (
    <Image
      source={{uri}}
      contentFit="cover"
      accessibilityIgnoresInvertColors
      accessibilityLabel=""
      accessibilityHint=""
      style={[a.rounded_md, t.atoms.bg_contrast_25, {width, height}]}
    />
  )
}

/**
 * Images as ordinary children, in frames of different shapes. The gallery
 * doesn't know they're images.
 */
function ImageContent() {
  const {t: l} = useLingui()
  return (
    <Section
      testID="galleryStorybook-images"
      titleText={<Trans>Image content</Trans>}
      descriptionText={
        <Trans>
          Portrait, square, and landscape frames as plain children. The frames,
          not the gallery, decide the sizes.
        </Trans>
      }>
      <Gallery.Root
        label={l`Image frames in different shapes`}
        testID="galleryStorybook-images-root">
        <Gallery.Item label={l`Portrait frame`}>
          <ImageFrame uri={welcome} width={120} height={160} />
        </Gallery.Item>
        <Gallery.Item label={l`Square frame`}>
          <ImageFrame uri={kawaii} width={140} height={140} />
        </Gallery.Item>
        <Gallery.Item label={l`Landscape frame`}>
          <ImageFrame uri={kawaiiSmol} width={220} height={124} />
        </Gallery.Item>
      </Gallery.Root>
      <CaptionText>120×160, 140×140, 220×124</CaptionText>
    </Section>
  )
}

/**
 * The image carousel used in posts, built on the same primitive, with the real
 * lightbox hooked up.
 */
function ImageAdapter() {
  const {openLightbox} = useLightboxControls()
  const {t: l} = useLingui()

  const adapterImages: app.bsky.embed.images.ViewImage[] = [
    {
      thumb: asUri(kawaii),
      fullsize: asUri(kawaii),
      alt: l`A kawaii scene`,
      // Landscape wider than the carousel allows, so it's cropped
      aspectRatio: {width: 1920, height: 1080},
    },
    {
      thumb: asUri(welcome),
      fullsize: asUri(welcome),
      alt: '',
      aspectRatio: {width: 1432, height: 1025},
    },
    {
      thumb: asUri(kawaiiSmol),
      fullsize: asUri(kawaiiSmol),
      alt: l`A small kawaii scene with no ratio on record`,
      // No ratio: starts square, then learns it from the loaded thumbnail
      aspectRatio: undefined,
    },
    {
      thumb: asUri(welcome),
      fullsize: asUri(welcome),
      alt: '',
      // Extreme portrait, so it's cropped
      aspectRatio: {width: 1, height: 3},
    },
  ]

  const onPress = (
    index: number,
    refs: AnimatedRef[],
    fetchedDims: (Dimensions | null)[],
    onIndexChange?: (index: number) => void,
  ) => {
    openLightbox({
      images: adapterImages.map((image, i) => ({
        uri: image.fullsize,
        thumbUri: image.thumb,
        alt: image.alt,
        dimensions: image.aspectRatio ?? null,
        thumbRect: null,
        thumbRef: refs[i] ?? null,
        thumbDimensions: fetchedDims[i] ?? null,
        thumbBorderRadius: 8,
        type: 'image',
      })),
      index,
      onIndexChange,
    })
  }

  return (
    <Section
      testID="galleryStorybook-adapter"
      titleText={<Trans>Production image adapter</Trans>}
      descriptionText={
        <Trans>
          The carousel used for post images. Tap an image to open the lightbox,
          change images, and close it: it should land on the right thumbnail.
          The first and last images are cropped, and the third learns its size
          when it loads.
        </Trans>
      }>
      <ImageGallery images={adapterImages} onPress={onPress} />
    </Section>
  )
}

/**
 * Different widths and heights, including a child wider than the gallery.
 */
function MixedContent() {
  const {t: l} = useLingui()
  const [width, setWidth] = useState(0)
  const wideWidth = (width || 300) + 80
  const wideCardSize = Math.round(wideWidth)
  const galleryWidth = Math.round(width)
  return (
    <Section
      testID="galleryStorybook-mixed"
      titleText={<Trans>Mixed content and sizes</Trans>}
      descriptionText={
        <Trans>
          Cards of different widths and heights, an image, and a card wider than
          the gallery. The strip is as tall as the tallest card, and nothing is
          cropped or resized.
        </Trans>
      }>
      <View onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        <Gallery.Root
          label={l`Cards and images of different sizes`}
          testID="galleryStorybook-mixed-root">
          <Gallery.Item
            label={l`Small card`}
            testID="galleryStorybook-mixed-small">
            <Card width={100} height={80} title={l`Small`} />
          </Gallery.Item>
          <Gallery.Item label={l`Medium card`}>
            <Card width={220} height={160} title={l`Medium`} tone="positive" />
          </Gallery.Item>
          <Gallery.Item
            label={l`Tall card`}
            testID="galleryStorybook-mixed-tall">
            <Card width={140} height={240} title={l`Tall`} tone="negative" />
          </Gallery.Item>
          <Gallery.Item label={l`Image`}>
            <ImageFrame uri={kawaii} width={180} height={120} />
          </Gallery.Item>
          <Gallery.Item
            label={l`Wide card`}
            testID="galleryStorybook-mixed-wide">
            <Card width={wideWidth} height={100} title={l`Wide`} />
          </Gallery.Item>
        </Gallery.Root>
      </View>
      <CaptionText>
        <Trans>
          Sizes: 100×80, 220×160, 140×240, 180×120, and a wide card of{' '}
          {wideCardSize}×100, which is the gallery width of {galleryWidth} plus
          80.
        </Trans>
      </CaptionText>
    </Section>
  )
}

/**
 * Children that handle their own presses, text, and focus.
 */
function InteractiveChildren() {
  const t = useTheme()
  const {t: l} = useLingui()
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const [focusCount, setFocusCount] = useState(0)
  const [pressCount, setPressCount] = useState(0)
  const [focused, setFocused] = useState(false)

  return (
    <Section
      testID="galleryStorybook-interactive"
      titleText={<Trans>Interactive children</Trans>}
      descriptionText={
        <Trans>
          Buttons and text fields work without starting a drag. Type, select
          text with the arrow keys, and click. The last item uses the focus
          render function to make its own button the keyboard target, which
          Enter and Space should press.
        </Trans>
      }>
      <Gallery.Root
        label={l`Interactive items`}
        testID="galleryStorybook-interactive-root">
        <Gallery.Item label={l`Counter`}>
          <View style={[a.gap_sm, a.align_start, {width: 180}]}>
            <Button
              label={l`Increment counter`}
              color="primary"
              size="large"
              testID="galleryStorybook-interactive-counter"
              onPress={() => setCount(c => c + 1)}>
              <ButtonText>
                <Trans>Tapped {count} times</Trans>
              </ButtonText>
            </Button>
          </View>
        </Gallery.Item>
        <Gallery.Item label={l`Text field`}>
          <View style={[{width: 240}]}>
            <TextField.Root>
              <TextField.Input
                label={l`Gallery text field`}
                value={text}
                onChangeText={setText}
                testID="galleryStorybook-interactive-input"
              />
            </TextField.Root>
          </View>
        </Gallery.Item>
        <Gallery.Item label={l`Focus target`}>
          {({focusRef, tabIndex, onFocus}) => (
            <Pressable
              ref={focusRef}
              tabIndex={tabIndex}
              accessibilityRole="button"
              accessibilityLabel={l`Focus target`}
              accessibilityHint={l`Counts how many times it was focused and pressed`}
              testID="galleryStorybook-interactive-focus"
              onPress={() => setPressCount(c => c + 1)}
              onFocus={() => {
                onFocus()
                setFocused(true)
                setFocusCount(c => c + 1)
              }}
              onBlur={() => setFocused(false)}
              style={[
                a.rounded_md,
                a.align_center,
                a.justify_center,
                a.border,
                t.atoms.bg_contrast_25,
                focused
                  ? t.atoms.border_contrast_high
                  : t.atoms.border_contrast_low,
                {width: 180, height: 100},
              ]}>
              <Text style={[a.font_bold]}>
                <Trans>Focus target</Trans>
              </Text>
              <Text
                style={[a.text_xs]}
                testID="galleryStorybook-interactive-focus-count">
                <Trans>Focused {focusCount} times</Trans>
              </Text>
              <Text
                style={[a.text_xs]}
                testID="galleryStorybook-interactive-press-count">
                <Trans>Pressed {pressCount} times</Trans>
              </Text>
            </Pressable>
          )}
        </Gallery.Item>
      </Gallery.Root>
      <CaptionText>
        <Trans>Text: “{text}”</Trans>
      </CaptionText>
    </Section>
  )
}

type DynamicCard = {id: number; tall: boolean; wide: boolean}

/**
 * Adding, removing, reordering, and resizing items, and revealing one from
 * the outside.
 */
function ChangingContent() {
  const {t: l} = useLingui()
  const ref = useRef<Gallery.GalleryRef>(null)
  const nextId = useRef(4)
  const [cards, setCards] = useState<DynamicCard[]>([
    {id: 1, tall: false, wide: false},
    {id: 2, tall: false, wide: false},
    {id: 3, tall: false, wide: false},
  ])
  const [showIntro, setShowIntro] = useState(true)
  const [nav, setNav] = useState<{
    index: number
    previous: number
    events: number
  }>({index: 0, previous: 0, events: 0})

  const toggleFirst = (key: 'tall' | 'wide') =>
    setCards(prev =>
      prev.map((card, i) => (i === 0 ? {...card, [key]: !card[key]} : card)),
    )

  return (
    <Section
      testID="galleryStorybook-changing"
      titleText={<Trans>Changing content</Trans>}
      descriptionText={
        <Trans>
          Change the items from outside. Resizing, reordering, and revealing are
          not user navigation, so the event count should only go up when you
          swipe, drag, or use the arrow keys.
        </Trans>
      }>
      <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
        <Button
          label={l`Add card`}
          color="secondary"
          size="small"
          testID="galleryStorybook-changing-add"
          onPress={() => {
            // Allocated here, not in the updater, which StrictMode replays
            const id = nextId.current
            nextId.current += 1
            setCards(prev => [...prev, {id, tall: false, wide: false}])
          }}>
          <ButtonText>
            <Trans>Add</Trans>
          </ButtonText>
        </Button>
        <Button
          label={l`Remove last card`}
          color="secondary"
          size="small"
          testID="galleryStorybook-changing-remove-last"
          onPress={() => setCards(prev => prev.slice(0, -1))}>
          <ButtonText>
            <Trans>Remove last</Trans>
          </ButtonText>
        </Button>
        <Button
          label={l`Remove first card`}
          color="secondary"
          size="small"
          testID="galleryStorybook-changing-remove-first"
          onPress={() => setCards(prev => prev.slice(1))}>
          <ButtonText>
            <Trans>Remove first</Trans>
          </ButtonText>
        </Button>
        <Button
          label={l`Reverse the order`}
          color="secondary"
          size="small"
          testID="galleryStorybook-changing-reverse"
          onPress={() => setCards(prev => [...prev].reverse())}>
          <ButtonText>
            <Trans>Reverse</Trans>
          </ButtonText>
        </Button>
        <Button
          label={l`Make the first card taller or shorter`}
          color="secondary"
          size="small"
          testID="galleryStorybook-changing-tall"
          onPress={() => toggleFirst('tall')}>
          <ButtonText>
            <Trans>Tall / short</Trans>
          </ButtonText>
        </Button>
        <Button
          label={l`Make the first card wider or narrower`}
          color="secondary"
          size="small"
          testID="galleryStorybook-changing-wide"
          onPress={() => toggleFirst('wide')}>
          <ButtonText>
            <Trans>Wide / narrow</Trans>
          </ButtonText>
        </Button>
        <Button
          label={l`Show or hide the intro card`}
          color="secondary"
          size="small"
          testID="galleryStorybook-changing-intro"
          onPress={() => setShowIntro(v => !v)}>
          <ButtonText>
            <Trans>Toggle intro</Trans>
          </ButtonText>
        </Button>
        <Button
          label={l`Reveal the last card`}
          color="primary"
          size="small"
          testID="galleryStorybook-changing-reveal"
          onPress={() =>
            ref.current?.scrollIntoView((showIntro ? 1 : 0) + cards.length)
          }>
          <ButtonText>
            <Trans>Reveal last</Trans>
          </ButtonText>
        </Button>
      </View>
      <Gallery.Root
        ref={ref}
        label={l`Cards that change`}
        testID="galleryStorybook-changing-root"
        onIndexChange={(index, previous) =>
          setNav(prev => ({index, previous, events: prev.events + 1}))
        }>
        {showIntro ? (
          <Gallery.Item key="intro" label={l`Intro card`}>
            <Card width={120} height={100} title={l`Intro`} tone="positive" />
          </Gallery.Item>
        ) : null}
        <>
          {cards.map(card => (
            <Gallery.Item
              key={card.id}
              label={l`Card ${card.id}`}
              testID={`galleryStorybook-changing-card-${card.id}`}>
              <Card
                width={card.wide ? 260 : 130}
                height={card.tall ? 200 : 100}
                title={l`Card ${card.id}`}
              />
            </Gallery.Item>
          ))}
        </>
        {[
          <Gallery.Item key="end" label={l`End card`}>
            <Card width={120} height={100} title={l`End`} tone="negative" />
          </Gallery.Item>,
        ]}
      </Gallery.Root>
      <Text testID="galleryStorybook-changing-nav">
        <Trans>
          Active index {nav.index} (from {nav.previous}), {nav.events} user
          navigation events
        </Trans>
      </Text>
    </Section>
  )
}

function CardStrip({label, testID}: {label: string; testID: string}) {
  const {t: l} = useLingui()
  return (
    <Gallery.Root label={label} testID={testID}>
      <Gallery.Item>
        <Card width={120} height={80} title={l`One`} />
      </Gallery.Item>
      <Gallery.Item>
        <Card width={120} height={80} title={l`Two`} tone="positive" />
      </Gallery.Item>
      <Gallery.Item>
        <Card width={120} height={80} title={l`Three`} tone="negative" />
      </Gallery.Item>
    </Gallery.Root>
  )
}

/**
 * A narrow container, and one that bleeds to the edge of its padded parent.
 */
function ConstrainedAndBleeding() {
  const t = useTheme()
  const {t: l} = useLingui()
  const [narrow, setNarrow] = useState(true)
  return (
    <Section
      testID="galleryStorybook-containers"
      titleText={<Trans>Constrained and bleeding containers</Trans>}
      descriptionText={
        <Trans>
          The gallery fills whatever width it has. Inside a bleed ancestor, the
          first and last items line up with the padded content while the rest
          run to the outer edge.
        </Trans>
      }>
      <Button
        label={narrow ? l`Make the panel wide` : l`Make the panel narrow`}
        color="secondary"
        size="small"
        testID="galleryStorybook-containers-toggle"
        onPress={() => setNarrow(v => !v)}>
        <ButtonText>
          {narrow ? <Trans>Make wide</Trans> : <Trans>Make narrow</Trans>}
        </ButtonText>
      </Button>
      <View
        testID="galleryStorybook-containers-panel"
        style={[
          a.border,
          a.rounded_md,
          a.p_sm,
          t.atoms.border_contrast_low,
          {width: narrow ? 200 : '100%', maxWidth: '100%'},
        ]}>
        <CardStrip
          label={l`Cards in a constrained panel`}
          testID="galleryStorybook-containers-panel-root"
        />
      </View>
      <Gallery.Bleed>
        <View
          testID="galleryStorybook-containers-bleed"
          style={[
            a.gap_sm,
            a.py_md,
            t.atoms.bg_contrast_25,
            {paddingHorizontal: 16},
          ]}>
          <Text style={[a.font_bold]}>
            <Trans>Padded container</Trans>
          </Text>
          <CardStrip
            label={l`Cards that bleed to the container edges`}
            testID="galleryStorybook-containers-bleed-root"
          />
        </View>
      </Gallery.Bleed>
    </Section>
  )
}

function EmptyAndSingle() {
  const t = useTheme()
  const {t: l} = useLingui()
  return (
    <Section
      testID="galleryStorybook-edge"
      titleText={<Trans>Empty and single</Trans>}
      descriptionText={
        <Trans>
          An empty gallery takes up no space. A single item behaves like any
          other, without dragging or arrow key navigation to go anywhere.
        </Trans>
      }>
      <View style={[a.border_t, a.border_b, t.atoms.border_contrast_low]}>
        <Gallery.Root
          label={l`Empty gallery`}
          testID="galleryStorybook-edge-empty"
        />
      </View>
      <CaptionText>
        <Trans>The two lines above should touch.</Trans>
      </CaptionText>
      <Gallery.Root
        label={l`Gallery with one item`}
        testID="galleryStorybook-edge-single">
        <Gallery.Item label={l`Only card`}>
          <Card width={160} height={90} title={l`Only`} />
        </Gallery.Item>
      </Gallery.Root>
    </Section>
  )
}
