# expo-bluesky-context-menu

Native iOS context menu with peek preview for images. Long-pressing a wrapped view shows a `UIContextMenuInteraction` with a full-size image preview and action menu. Android and web fall through to a passthrough `View`.

The app re-exports this module through `#/components/PeekMenu`, which provides a noop on non-iOS platforms. Consumers should use `PeekMenu` rather than importing this module directly.

## JS API

Declarative, compound-component API. `Root` collects children tagged as `Trigger` and `Menu`, serializes the menu items, and renders a single native view.

```tsx
import * as PeekMenu from '#/components/PeekMenu'

<PeekMenu.Root>
  <PeekMenu.Trigger
    preview={{type: 'image', uri: fullsizeUrl, thumbUri: thumbUrl, aspectRatio: 1.5}}
    borderRadius={12}>
    {children}
  </PeekMenu.Trigger>
  <PeekMenu.Menu>
    <PeekMenu.MenuItem id="save" onSelect={handleSave}>
      <PeekMenu.MenuItemIcon icon={SaveIcon} />
      <PeekMenu.MenuItemText>Save image</PeekMenu.MenuItemText>
    </PeekMenu.MenuItem>
  </PeekMenu.Menu>
</PeekMenu.Root>
```

`Trigger`, `Menu`, `MenuItem`, `MenuItemIcon`, and `MenuItemText` are sentinel components — they render nothing. `Root` walks the children tree at render time, extracts their props, and passes serialized data to the native view.

### Props

**`Trigger`**
- `preview?: PreviewContent` — what to show during peek. Only `image` is implemented; `video` and `externalCard` are typed but will fall back to no preview.
- `borderRadius?: number` — corner radius of the thumbnail. Used in the native targeted-preview so the lift animation matches the clipping.
- `onPreviewPress?: () => void` — fires when the user taps the expanded preview to commit into it (i.e. open the lightbox).

**`MenuItem`**
- `id: string` — stable identifier, sent back in the `onItemPress` event.
- `onSelect: () => void` — called when this item is tapped.
- `destructive?: boolean` — renders the item in red.
- `disabled?: boolean` — greys the item out.

**`MenuItemIcon`**
- `icon: IconWithSvgMeta` — any component from `#/components/icons` that has `svgPaths`, `svgViewBox`, and `svgStrokeWidth` metadata. Rendered natively via `IconRenderer`.

### Preview types

```ts
type PreviewContent =
  | {type: 'image'; uri: string; thumbUri?: string; aspectRatio: number}
  | {type: 'video'; uri: string; poster?: string; aspectRatio: number}      // not yet implemented
  | {type: 'externalCard'; thumbUri?: string; title: string; url: string}   // not yet implemented
```

## iOS native architecture

### View hierarchy

```
ExpoBlueskyContextMenuView (ExpoView subclass)
  └── hosts the RN children directly
  └── attaches a UIContextMenuInteraction to itself
```

The view is both the interaction's delegate and the target for the `UITargetedPreview`, so iOS animates the lift/dismiss between the actual thumbnail and the preview controller.

### Files

| File | Purpose |
|---|---|
| `ExpoBlueskyContextMenuModule.swift` | Expo module definition. Registers the view, props (`preview`, `menuItems`, `previewCornerRadius`), and events (`onItemPress`, `onPreviewPress`). |
| `ExpoBlueskyContextMenuView.swift` | The native view. Hosts `UIContextMenuInteraction`, builds targeted previews, and dispatches events back to JS. |
| `PreviewFactory.swift` | Decodes the `preview` prop dict and constructs the right `UIViewController`. Currently only handles `image` → `ImagePreviewController`. |
| `ImagePreviewController.swift` | Preview VC for images. Sizes via `preferredContentSize` based on aspect ratio. Loads images from SDWebImage's shared cache (see below). |
| `MenuBuilder.swift` | Converts the JS menu item specs into a `UIMenu` with `UIAction`s. Supports icons, destructive styling, and disabled state. |
| `IconRenderer.swift` | Rasterizes SVG path data from the app's icon components into `UIImage`s for menu items. Results are cached by `NSCache`. |
| `SVGPathParser.swift` | Minimal SVG `d`-attribute parser. Handles M/L/H/V/C/S/Q/T/A/Z (the subset used by the Bluesky icon set). |

### Image loading

`ImagePreviewController` shares SDWebImage's `SDImageCache.shared` and `SDWebImageManager.shared` with expo-image, so cache hits are free:

1. **Memory cache hit on fullsize?** Paint it immediately — zero latency.
2. **Memory cache hit on thumbnail?** Paint the thumb as a placeholder, then async-load the fullsize.
3. **No cache hit?** Show nothing initially, async-load the fullsize.

Disk cache lookups are intentionally skipped in the synchronous path to avoid blocking the main thread during the peek animation.

### Targeted preview & bounds snapping

The view overrides `bounds` to snap widths/heights to exact pixel boundaries:

```swift
override var bounds: CGRect {
  get {
    let b = super.bounds
    let s = self.window?.screen.scale ?? UIScreen.main.scale
    return CGRect(
      x: b.origin.x, y: b.origin.y,
      width: round(b.width * s) / s,
      height: round(b.height * s) / s
    )
  }
  set { super.bounds = newValue }
}
```

React Native's Yoga layout engine operates in float32 and can produce bounds like `150.00001525878906`. iOS's context menu dismiss animation interpolates between the preview and the target bounds — a sub-pixel mismatch causes a visible frame-size glitch on the first animation frame. Snapping to device pixels eliminates this.

### `onPreviewPress` timing

`onPreviewPress` fires immediately in `willPerformPreviewActionForMenuWith`, not inside `animator.addCompletion`. This lets the JS side open the lightbox while iOS's commit animation is still running, so the two transitions overlap rather than running sequentially.

## Known limitations

- **Carousel clipping**: When an image is inside a horizontal `FlatList` (gallery carousel), the `UIScrollView`'s `clipsToBounds` clips the peek lift animation and its shadow. This is a UIKit constraint — the scroll view clips its contents during the snapshot phase, before iOS renders the lift in its own window.
- **Android/web**: No native implementation yet. The module falls through to a plain `View` wrapper. The `PeekMenu` re-export layer noops these platforms entirely.
- **Video and external card previews**: Typed in `PreviewContent` but not implemented on the native side. `PreviewFactory` returns `nil` for unknown types, which makes iOS show its default preview (a snapshot of the source view).
