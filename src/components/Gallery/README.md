# Gallery

A horizontal strip of arbitrary content. Each item owns its own width and
height, and the strip is as tall as the tallest item. It handles swiping,
dragging, trackpads, and the arrow keys; it does not crop, resize, or
virtualize anything.

```tsx
import * as Gallery from '#/components/Gallery'
```

## Import boundaries

App code does not import this module. It uses a configured gallery module,
which wraps this one with the choices that make it fit a use case, and exports
everything the app needs from there. For post images that is
`#/components/images/Gallery`:

```tsx
import {
  Gallery,
  GalleryBleed,
  useGalleryBleed,
} from '#/components/images/Gallery'
```

`GalleryBleed` and `useGalleryBleed` are this module's `Bleed` and
`useGalleryBleed`, re-exported, so there is still one bleed context.

The `Root` and `Item` examples below are for implementing a configured wrapper,
and for the generic Storybook. A lint rule (`no-restricted-imports` in
`.oxlintrc.json`) rejects `#/components/Gallery` and its subpaths everywhere
except:

- `src/components/Gallery/**`: this implementation, its tests, and its
  Storybook
- `src/components/images/Gallery/**`: the image wrapper and its tests
- `src/view/screens/Storybook/Storybook.tsx`: the page that shows the Storybook

A new configured wrapper opts in by adding its own directory to that list when
it is introduced.

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

| Prop            | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| `label`         | Required, translated. Names the carousel for assistive tech.                |
| `testID`        | Optional.                                                                   |
| `ref`           | Optional `GalleryRef`, see below.                                           |
| `onIndexChange` | `(index, previousIndex) => void`. Called when the user navigates to a different item. |
| `children`      | `Gallery.Item`s. Fragments, arrays, and conditional `null`s are flattened.  |

`onIndexChange` reports native swiping, mouse dragging, arrow keys, and
Safari horizontal-wheel navigation. Browser touch scrolling and Chrome/Firefox
trackpad scrolling move the content, but do not report index changes; this
preserves the existing image carousel behavior. It is **not** called on
mount, for `scrollIntoView`, when focus simply lands on an item (for example a
click just before opening a lightbox), or when items are added, removed, or
reordered.

Give every child a stable `key`. Measurements and the active item follow the
key, so reordering keeps the active item and removing the active item moves to
a nearby one.

### `Gallery.Item`

| Prop       | Description                                       |
| ---------- | ------------------------------------------------- |
| `label`    | Optional accessible label for the slide.          |
| `testID`   | Optional.                                         |
| `children` | A node, or a function, see "Focus" below.         |

The item wraps its children in a view that is measured as it is: never
stretched, and given no width, aspect ratio, or height by the gallery.

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
  shrinking. Items are aligned to the top.
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
  and Android's start-edge overscroll settles back.
- Screen reader: items are reachable and labelled, and the image adapter shows
  its vertical list of images.
