# @react-navigation/bottom-tabs+7.16.0.patch

## Native tabs: badge text color and font on iOS

`NativeBottomTabView` already turns `tabBarBadgeStyle.color` into a badge text
color, but only passes it in the Android appearance. This adds it to the iOS
appearance too, as `tabBarItemBadgeTextColor`, and adds `fontSize` and
`fontWeight` to `tabBarBadgeStyle`, passed as `tabBarItemBadgeFontSize` and
`tabBarItemBadgeFontWeight`. Our `react-native-screens` patch applies them to
`badgeTextAttributes`.

We use them for smaller, bolder badges than UIKit's, see
`NativeTabsNavigator` in `src/Navigation.tsx`. UIKit styles every badge with
the selected tab's appearance, so set them for all tabs (in `screenOptions`).

Both `src` and `lib/module` are patched, since Metro may resolve either.

Not upstreamed yet.

## Native tabs: `tabBarShowLabel` on iOS

Adds a `tabBarShowLabel` option (named after the JS tabs option). When it's
`false`, the screen gets no `title`, which `react-native-screens` needs to be
`undefined` (not an empty string) for UIKit to drop the label, and the label
moves to `tabBarItemAccessibilityLabel` so VoiceOver still reads it. Upstream
always passes a title, so labels can't be hidden.

We hide them because the labels don't fit (Notifications is too long and
throws the alignment off).
