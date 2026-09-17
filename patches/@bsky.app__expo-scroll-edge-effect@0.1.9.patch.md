# expo-scroll-edge-effect Patch

## iOS: guarantee a scroll edge effect region for any container

On iOS 26+, `UIScrollEdgeElementContainerInteraction` derives the effect
(blur) region from the "elements" UIKit recognizes among the container's
descendants - image views, labels, glass views and controls - not from the
container's own frame ("Any descendants of this view that should affect the
shape of the edge effect, such as labels, images, glass views, and controls,
will automatically do so", Apple docs). React Native views, text
(`RCTParagraphTextView`) and react-native-svg are plain `UIView`s that UIKit
ignores, so a `ScrollEdgeEffect` container made only of those gets an invalid
region and renders no effect at all. The DM conversation header hit this for
profiles without an avatar image (default avatar is SVG).

The patch adds an empty, non-interactive `UIImageView` filling the container
bounds when the interaction attaches, so every container yields a region equal
to its own frame. It is appended last (and kept last in `layoutSubviews`)
because React Native mounts children by absolute subview index.

Upstream: https://github.com/bluesky-social/expo-scroll-edge-effect/pull/15
