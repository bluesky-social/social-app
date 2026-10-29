# @expo/ui+58.0.23.patch

## Material 3 Expressive grouped menus (Android)

`android/src/main/java/expo/modules/ui/menu/*`, `ExpoUIModule.kt`, and the
`jetpack-compose/DropdownMenu` JS in `build/` and `src/`

`DropdownMenu` wraps Compose's original `DropdownMenu` and `DropdownMenuItem`:
one flat surface with 4dp corners and full-width dividers. The Material 3
Expressive menu is in material3 1.5.0-beta01, which @expo/ui already depends
on, but @expo/ui doesn't expose it. In that menu, groups are separate rounded
surfaces spaced apart, groups can have labels, and selected items get a tinted
highlight and a leading check.

The patch adds:

- `DropdownMenuGroup` (`DropdownMenuGroupView`), with an optional `label`. When
  a `DropdownMenu`'s items are groups, the menu renders with
  `DropdownMenuPopup`. Groups are spaced by `MenuDefaults.GroupSpacing` and
  shaped by `MenuDefaults.groupShape(index, count)`.
- For items in a group, the Expressive `DropdownMenuItem`, shaped by
  `MenuDefaults.itemShape(index, count)`. Positions come from the native
  children, so conditional items in JS shape correctly.
- `DropdownMenuItem`'s `selected` prop and `SelectedLeadingIcon` slot, which
  render a `SelectableDropdownMenuItem`.

Menus without groups render exactly as before. Our `<Menu.Root inline>`
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
