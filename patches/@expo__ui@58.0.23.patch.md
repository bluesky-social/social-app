# @expo/ui+58.0.23.patch

## Material 3 Expressive menus (Android)

`android/src/main/java/expo/modules/ui/ExpoUIModule.kt`,
`android/src/main/java/expo/modules/ui/menu/*` and the `jetpack-compose/DropdownMenu`
types in `build/` and `src/`

@expo/ui wraps Compose's original `DropdownMenu` and `DropdownMenuItem`: one
flat surface with 4dp corners and full-width dividers. The Material 3
Expressive menu is in material3 1.5.0-beta01, which @expo/ui already depends
on, but @expo/ui doesn't expose it.

This is a backport of https://github.com/expo/expo/pull/52598, unchanged. Each
component wraps one Compose composable:

- `DropdownMenuPopup`, anchored to its parent, so it goes in a `Box` next to
  the trigger. Its `modifiers` go on the popup's content.
- `DropdownMenuGroup`, shaped by `shapes: {index, count}` through
  `MenuDefaults.groupShape`.
- `SelectableDropdownMenuItem`, with a `SelectedLeadingIcon` slot (the
  tinted highlight and leading check).
- `DropdownMenuItem` gets a `shape: {index, count}` prop, which renders the
  Expressive item shaped by `MenuDefaults.itemShape`, and a `SupportingText`
  slot.

Our `<Menu.Root inline>` (`src/components/Menu/inline/index.android.tsx`) is
the only user. It counts the items itself (see `InlineItemPositionContext`),
and pads the popup's content for the gap between the menu and its trigger.
Colours come from the `Host`'s Material theme, which we derive from ALF (see
`useMaterialTheme` in `src/alf/material.ts`).

@expo/ui ships a prebuilt Android AAR, so it must stay in
`expo.autolinking.android.buildFromSource` (as `expo-ui`), or Gradle links the
unpatched AAR and the Kotlin hunks don't apply.

The `build/` files are hand-compiled from the PR's `src/`, since upstream
doesn't commit them. Drop this section once the upstream PR ships.

## `Button` `url` prop type

`build/jetpack-compose/Button/index.d.ts`, `src/jetpack-compose/Button/index.tsx`

Types only. Adds `url` to `ButtonProps` for the Android Trending Topics widget
(`expo-widgets`), where a button opens a deep link instead of calling
`onClick`.
