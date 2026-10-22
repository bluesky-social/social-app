## RCTScrollViewComponentView.mm Patch - Disable ScrollView component-view recycling on New Arch

Fabric ScrollView component-view recycling is disabled by returning `NO` from
`shouldBeRecycled`. This was added in social-app#8295 to prevent a recycled ScrollView from
carrying `contentInset` mutations, such as those made by Reanimated, into the next rendered
ScrollView. The original patch also reset the inset in `prepareForRecycle`; that reset no longer
survives, leaving the recycling override as the remaining protection. Re-evaluate this hunk when
upgrading React Native rather than assuming it belongs to either ScrollView fix above.
