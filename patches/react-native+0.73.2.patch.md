# TextInput Patch

Patching `RCTBaseTextShadowInput.mm` from https://github.com/facebook/react-native/pull/38359. This fixes some text
getting cut off inside the composer. This was merged in December, so we should be able to remove this patch when RN
ships the next release.
