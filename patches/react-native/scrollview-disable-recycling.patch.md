## RCTScrollViewComponentView.mm Patch - Disable ScrollView component-view recycling on New Arch

Fabric ScrollView component-view recycling is disabled by returning `NO` from
`shouldBeRecycled`. This was added in social-app#8295 to prevent a recycled ScrollView from
carrying `contentInset` mutations, such as those made by Reanimated, into the next rendered
ScrollView. The original patch also reset the inset in `prepareForRecycle`; that reset no longer
survives, leaving the recycling override as the remaining protection. It is independent of the two
ScrollView fixes we carried until React Native 0.87 shipped them (facebook/react-native#56747
and #56832). Re-evaluate this hunk when upgrading React Native.
