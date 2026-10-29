# @expo/ui+58.0.23.patch

## Material 3 Expressive menus (Android)

`android/src/main/java/expo/modules/ui/menu/*` and the `jetpack-compose/DropdownMenu`
types in `build/` and `src/`

`DropdownMenu` wraps Compose's original `DropdownMenu` and `DropdownMenuItem`:
one flat surface with 4dp corners and full-width dividers. The Material 3
Expressive menu is in material3 1.5.0-beta01, which @expo/ui already depends
on, but @expo/ui doesn't expose it.

The patch adds:

- `DropdownMenu`'s `expressive` prop. The menu renders as a `DropdownMenuPopup`
  holding one `DropdownMenuGroup`, and each item is an Expressive
  `DropdownMenuItem`, shaped by `MenuDefaults.itemShape(index, count)`.
  Positions come from the native children, so conditional items in JS shape
  correctly.
- `DropdownMenuItem`'s `selected` prop and `SelectedLeadingIcon` slot, which
  render a `SelectableDropdownMenuItem` (tinted highlight and leading check).
- `DropdownMenu`'s `anchorGap`, the space between an expressive menu and its
  trigger. The menu's position candidates are internal to Compose, so it's
  vertical padding on the popup content, which keeps the gap on the trigger's
  side whether the menu opens below or above.

Colours come from the `Host`'s Material theme, which we derive from ALF (see
`useMaterialTheme` in `src/alf/material.ts`). Menus without `expressive` render
exactly as before. Our `<Menu.Root inline>`
(`src/components/Menu/inline/index.android.tsx`) is the only user.

@expo/ui ships a prebuilt Android AAR, so it must stay in
`expo.autolinking.android.buildFromSource` (as `expo-ui`), or Gradle links the
unpatched AAR and the Kotlin hunks don't apply.

Drop this once @expo/ui exposes the Expressive menu APIs.

## `Button` `url` prop type

`build/jetpack-compose/Button/index.d.ts`, `src/jetpack-compose/Button/index.tsx`

Types only. Adds `url` to `ButtonProps` for the Android Trending Topics widget
(`expo-widgets`), where a button opens a deep link instead of calling
`onClick`.
