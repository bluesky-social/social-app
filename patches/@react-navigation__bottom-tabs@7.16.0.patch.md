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
