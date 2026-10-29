# @expo/ui+58.0.23.patch

## Material 3 Expressive menus (Android)

`android/src/main/java/expo/modules/ui/menu/*` and the `jetpack-compose/DropdownMenu`
types in `build/` and `src/`

`DropdownMenu` wraps Compose's original `DropdownMenu` and `DropdownMenuItem`:
one flat surface with 4dp corners and full-width dividers. The Material 3
Expressive menu is in material3 1.5.0-beta01, which @expo/ui already depends
on, but @expo/ui doesn't expose it.

The patch mirrors the Compose API, as proposed upstream in
https://github.com/expo/expo/pull/52574:

- A `DropdownMenuGroup` view, which renders Compose's `DropdownMenuGroup`, shaped
  by `MenuDefaults.groupShape(index, count)` from its position among the
  menu's groups (as `SegmentedButton` does in its row). Its `color` is the
  group's `containerColor`.
- `DropdownMenu`: when `DropdownMenu.Items` has a `DropdownMenuGroup`, the menu
  is a `DropdownMenuPopup` with its groups spaced by `MenuDefaults.GroupSpacing`,
  instead of the original `DropdownMenu`.
- `DropdownMenuItem`: in a group, it's an Expressive `DropdownMenuItem`, shaped
  by `MenuDefaults.itemShape(index, count)` from its position among the group's
  items, so labels, dividers and conditional items in JS don't throw it off. Its
  `selected` prop and `SelectedLeadingIcon` slot render a
  `SelectableDropdownMenuItem` (tinted highlight and leading check).

Local only, not upstream: `DropdownMenu`'s `anchorGap`, the space between a
grouped menu and its trigger. The menu's position candidates are internal to
Compose, so it's vertical padding on the popup content, which keeps the gap on
the trigger's side whether the menu opens below or above.

Colours come from the `Host`'s Material theme, which we derive from ALF (see
`useMaterialTheme` in `src/alf/material.ts`). Menus without groups render
exactly as before. Our `<Menu.Root inline>`
(`src/components/Menu/inline/index.android.tsx`) is the only user.

@expo/ui ships a prebuilt Android AAR, so it must stay in
`expo.autolinking.android.buildFromSource` (as `expo-ui`), or Gradle links the
unpatched AAR and the Kotlin hunks don't apply.

Drop this (except `anchorGap`) once the upstream PR ships.

## `Button` `url` prop type

`build/jetpack-compose/Button/index.d.ts`, `src/jetpack-compose/Button/index.tsx`

Types only. Adds `url` to `ButtonProps` for the Android Trending Topics widget
(`expo-widgets`), where a button opens a deep link instead of calling
`onClick`.
