# @react-navigation/bottom-tabs+7.16.0.patch

## Native tabs: pass the badge text color on iOS

`NativeBottomTabView` already turns `tabBarBadgeStyle.color` into a badge text
color, but only passes it in the Android appearance. This adds it to the iOS
appearance too, as `tabBarItemBadgeTextColor`, which our
`react-native-screens` patch applies to `badgeTextAttributes`.

We need it to draw a dot badge (a "●" with a clear background and our blue
text) for the chat requests and Following v2 dots, see `NativeTabsNavigator`
in `src/Navigation.tsx`.

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
