## RCTViewComponentView.mm Patch - Hairline border strokes dropped at certain subpixel Y offsets on New Arch

Symptom: dividers built as `borderTopWidth: hairlineWidth` vanish on some screens and not
others, deterministically by the view's absolute subpixel Y. A background fill of the same
geometry always renders.

Cause: Fabric draws borders as a stretched 9-slice image. The consumer
(`RCTAddContourEffectToLayer`) hardcodes the stretchable middle as a 1pt band, which matched
the image the producer built until RN 0.81. facebook/react-native#54237 changed the image
size to `ceil(insets) + 1 + ceil(insets)` without updating that formula, so for fractional
(hairline) insets the labels no longer match the image: transparent filler is treated as a
rigid cap, and when squeezed into a one-pixel-tall layer the sampling can land on it instead
of the stroke - no line.

Fix: compute the middle from the cap insets (`size - caps`) instead of assuming 1pt.

Upstream issue: https://github.com/react/react-native/issues/58054 (repro:
https://github.com/abulenok/HairlineBorderRepro, fails identically on 0.86.0 and 0.87.0; the
1pt formula is still there in 0.88.0).
