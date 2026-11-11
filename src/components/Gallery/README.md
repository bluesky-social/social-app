# Gallery

A horizontal strip of arbitrary content. Each item owns its own width and
height, and the strip is as tall as the tallest item. An opt-in `stretch` mode
lets slides share that height. It handles swiping, dragging, trackpads, and the
arrow keys; it does not crop or virtualize anything.

```tsx
import * as Gallery from '#/components/Gallery'
```

## Post images

Post images use `#/components/images/Gallery`, which wraps this module with the
choices that make it fit them and exports everything the app needs from there:

```tsx
import {
  Gallery,
  GalleryBleed,
  useGalleryBleed,
} from '#/components/images/Gallery'
```

`GalleryBleed` and `useGalleryBleed` are this module's `Bleed` and
`useGalleryBleed`, re-exported, so there is still one bleed context. Anything
else imports this module directly.

## Usage

Images (sized by the frames, not the gallery):

```tsx
<Gallery.Root label={l`Photos`}>
  {photos.map(photo => (
    <Gallery.Item key={photo.id} label={photo.alt}>
      <Image
        source={{uri: photo.uri}}
        style={{width: 160, height: 200, borderRadius: 8}}
      />
    </Gallery.Item>
  ))}
</Gallery.Root>
```

Anything else, at any size:

```tsx
<Gallery.Root label={l`Featured items`} onIndexChange={(index, previous) => {}}>
  <Gallery.Item label={l`Small card`}>
    <View style={{width: 100, height: 80}} />
  </Gallery.Item>
  <Gallery.Item label={l`Tall card`}>
    <View style={{width: 140, height: 240}} />
  </Gallery.Item>
</Gallery.Root>
```

### `Gallery.Root`

| Prop            | Description                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------- |
| `label`         | Required, translated. Names the carousel for assistive tech.                                |
| `testID`        | Optional.                                                                                   |
| `ref`           | Optional `GalleryRef`, see below.                                                           |
| `stretch`       | Optional boolean, default false. Stretch slides to the tallest sibling.                     |
| `snapToItems`   | Optional boolean, default false. Snap native scrolling to slide boundaries. Ignored on web. |
| `onIndexChange` | `(index, previousIndex) => void`. Called when the user navigates to a different item.       |
| `children`      | `Gallery.Item`s. Fragments, arrays, and conditional `null`s are flattened.                  |

`footer` optionally renders non-scrolling content within the gallery context,
without including it in slide counting or height measurements. Use it for
`Gallery.PageDots`, directly or inside a layout wrapper:

```tsx
<Gallery.Root label={l`Featured apps`} footer={<Gallery.PageDots />}>
  {apps.map(app => (
    <Gallery.Item key={app.id} label={app.title}>
      <AppCard app={app} />
    </Gallery.Item>
  ))}
</Gallery.Root>
```

`snapToItems` opts into slide snapping on iOS and Android. Snap positions use
measured item widths and the gap, so variable-width slides work too. Positions
near the end are clamped to the scrollable range; the last slide can still be
fully revealed. Native inertia uses fast deceleration when enabled. When the
prop is omitted, native scrolling is free. Web ignores the prop.

### `Gallery.PageDots`

One dot per item, including when several items fit in the viewport. Hidden for
zero or one item. Optional `style` and `testID` props configure the row. The
active dot grows from 8 to 30 pixels wide over 200ms as the previous dot shrinks;
reduced motion makes the change immediate. Colors follow the theme.

Dots are read-only on every platform, with no buttons or extra tab stops.
The row exposes a single translated position label to screen readers. Use
the gallery's swipe, drag, trackpad, and arrow-key navigation to move between
items.

The active dot follows the actual scroll position, including at shared or
clamped offsets, rather than a separately selected target item. This display
state is separate from `onIndexChange`, which follows the rules under
"Navigation callbacks" below.

### Navigation callbacks

`onIndexChange` reports native swiping, mouse dragging, arrow keys, and
Safari horizontal-wheel navigation. Browser touch scrolling and Chrome/Firefox
trackpad scrolling move the content, but do not report index changes.
`onIndexChange` is **not** called on mount, for `scrollIntoView`, when focus
simply lands on an item (for example a click just before opening a lightbox),
or when items are added, removed, or reordered.

Give every child a stable `key` so measurements stay associated with the
correct item. Selection is index-based; it does not follow an item through
reordering or removal.

### `Gallery.Item`

| Prop       | Description                               |
| ---------- | ----------------------------------------- |
| `label`    | Optional accessible label for the slide.  |
| `testID`   | Optional.                                 |
| `children` | A node, or a function, see "Focus" below. |

The item wraps its children in a view with no imposed width, aspect ratio, or
height. By default it stays at its intrinsic height; with `Root stretch` its
wrapper stretches to the tallest sibling.

### `GalleryRef`

```tsx
const ref = useRef<Gallery.GalleryRef>(null)
ref.current?.scrollIntoView(3)
```

`scrollIntoView(index)` scrolls the least distance needed to show the item,
without animating. Items that are already visible don't move; an item wider
than the gallery lines up its leading edge. It does not move focus, and does
not call `onIndexChange`. Invalid indices, and empty galleries, are ignored.

### `Gallery.Bleed`

Wrap a padded container (it must be a single element) to let galleries inside
it run to the container's edges while the first and last items stay lined up
with the padded content.

```tsx
<Gallery.Bleed>
  <View style={{paddingHorizontal: 16}}>
    <Gallery.Root label={l`Photos`}>{/* ... */}</Gallery.Root>
  </View>
</Gallery.Bleed>
```

`useGalleryBleed()` exposes the context for the posts' layout helpers.

## Sizing

- Children need a real layout size: explicit dimensions, intrinsic content, or
  a width derived from the parent's layout. Don't size a child as a
  percentage of the gallery's height, since the gallery's height comes from its
  children and the two would depend on each other.
- The strip is as tall as its tallest current item, and follows items as they
  grow, shrink, or leave. An item wider than the gallery scrolls rather than
  shrinking. Items are aligned to the top by default.
- With `stretch`, the flex row determines its own height instead of applying a
  measured height back to it. This lets it shrink when the tallest child shrinks
  or leaves. To fill a slide, use `flexGrow: 1` on the card and any intermediate
  wrappers. Keep image dimensions/aspect ratios on an inner frame rather than
  stretching the image itself. The Atmosphere Explore carousels use this mode;
  post-image galleries retain intrinsic sizing.
- The space between items is fixed at 8, since the navigation math depends on
  it.
- An empty gallery takes up no height.
- All children are rendered eagerly. This is a small carousel, not an
  unbounded list: don't put hundreds of items in it.

## Focus and keyboard

On web, one item at a time is a tab stop, and the arrow keys move between items
while focus is inside the gallery. The arrow keys are left alone when an input,
text area, select, slider, or editable element has focus, and dragging doesn't
start from those either. Buttons still click, and are still draggable.

By default the item itself is the focus target. For a slide with a specific
interactive element, pass a function as children and attach the props to it:

```tsx
<Gallery.Item label={alt}>
  {({focusRef, tabIndex, onFocus}) => (
    <Pressable
      ref={focusRef}
      tabIndex={tabIndex}
      onFocus={() => {
        onFocus()
        // your own focus handling
      }}
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={alt}
      accessibilityHint={l`Opens full image`}>
      {/* ... */}
    </Pressable>
  )}
</Gallery.Item>
```

With a screen reader on, no tab stops are imposed and nothing is hidden.

## Images

Use `#/components/images/Gallery` for post images. It is a thin adapter over
this component that adds the things specific to images: a height per
breakpoint and context, aspect ratio clamping with crop badges, the ALT badge,
the image context menu, the lightbox hand-off, and the carousel swipe metric.
This component knows nothing about any of that.

## Storybook

Open Settings, then Storybook (the `Debug` route, `/sys/debug`). The Gallery
section is at the bottom of the page, after the other component examples. `Storybook.tsx` is
deliberately not exported from `index.tsx`, so normal imports don't pull in its
fixtures.

## Tests

Automated tests live in a `__tests__` directory next to the code they cover:
`src/components/Gallery/__tests__` and `src/components/images/Gallery/__tests__`.
Anything only tests use, such as helpers, mocks, and fixtures, lives there too.
The fake DOM used by the web handler tests is `__tests__/fakeDom.ts`.

```bash
pnpm test --runInBand src/components/Gallery/__tests__ src/components/images/Gallery/__tests__
```

## QA checklist

- Mixed content: every card keeps its size, the strip is as tall as the
  tallest card, and the wide card scrolls instead of being cropped.
- Stretching cards: all card backgrounds share a height. Toggle tall content
  and remove/re-add the tallest card; the row must grow and shrink without a
  stale height. Check rotation and larger font sizes too.
- Changing content: add, remove, reverse, tall/short and wide/narrow all
  resize the strip without stale offsets. Neither these nor "Reveal last"
  increase the navigation event count; swiping, dragging, and arrow keys do.
- Interactive: typing and arrow keys in the text field don't move the gallery;
  the counter button clicks; Enter and Space press the focus target.
- Constrained: the panel resizes without overflowing a narrow screen. Bleed:
  the first and last items line up with the padding, the rest reach the edge.
- Empty has no height; a single item doesn't drag or navigate anywhere.
- Image adapter: opening the lightbox and changing images, including after a
  resize or rotation, closes onto the right thumbnail.
- Web: click versus drag, trackpad scrolling, normal page scrolling, and
  (in Safari) no back/forward swipe from horizontal scrolling.
- Native: swiping works inside the vertical scroll without opening the drawer,
  and Android's start-edge overscroll settles back. Toggle native snapping in
  the page dots example: releases should settle on slide boundaries or the
  content end. Turn it off to restore free scrolling.
- Page dots: swipe/drag/trackpad scrolling updates the position indicator.
  Dots are not buttons or extra tab stops on any platform. Reveal the last
  card in Storybook and check the indicator follows the scroll position,
  including when multiple cards fit. Check that reduced motion skips animation.
- Screen reader: items are reachable and labelled, and the image adapter shows
  its vertical list of images.
