# @expo/ui+58.0.26.patch

## `Button` `url` prop type

`build/jetpack-compose/Button/index.d.ts`, `src/jetpack-compose/Button/index.tsx`

Types only. Adds `url` to `ButtonProps` for the Android Trending Topics widget
(`expo-widgets`), where a button opens a deep link instead of calling
`onClick`.
