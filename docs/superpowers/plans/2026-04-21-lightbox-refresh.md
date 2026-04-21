# Lightbox Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Co-locate all lightbox code under `/features/lightbox/` and refresh the chrome (native = full redesign; web = light reskin).

**Architecture:** Phase 1 is a pure file migration. Phase 2 builds a shared circle button primitive. Phase 3 builds four new native chrome components (header, footer, menu, pager dots) and wires them into the existing pager. Phase 4 applies a light reskin on web. Phase 5 is end-to-end verification. Every phase leaves the app runnable.

**Tech Stack:** React Native 0.81 / Expo 54, TypeScript, ALF design system, React Compiler, Reanimated V3, Gesture Handler, Lingui for i18n. Existing `#/components/ContextMenu` is reused for the native menu popover; existing `#/components/Menu` (radix dropdown) is reused on web.

**Ticket:** APP-2046 · **Spec:** `docs/superpowers/specs/2026-04-21-lightbox-refresh-design.md`

**Testing note:** This codebase has no UI rendering tests — existing Jest tests are for pure logic only. Verification for this work is `yarn typecheck` + `yarn lint` + `yarn test` + manual smoke on iOS simulator, Android emulator, and web. Do NOT invent new UI unit tests; rely on type-checking and visual verification.

---

## Phase 1 — File migration (pure moves, no behavior change)

### Task 1: Move state module and update all consumers

**Files:**
- Create: `src/features/lightbox/state.tsx` (identical content to `src/state/lightbox.tsx`)
- Delete: `src/state/lightbox.tsx`
- Modify: 7 consumers listed below

- [ ] **Step 1: Move the file with git mv**

```bash
mkdir -p src/features/lightbox
git mv src/state/lightbox.tsx src/features/lightbox/state.tsx
```

- [ ] **Step 2: Update every consumer import**

Change the import path in each of these files from `#/state/lightbox` to `#/features/lightbox/state`:

| File | Line | Exports used |
|---|---|---|
| `src/App.native.tsx` | 34 | `Provider as LightboxStateProvider` |
| `src/App.web.tsx` | 27 | `Provider as LightboxStateProvider` |
| `src/state/util.ts` | 4 | `useLightboxControls` |
| `src/screens/Profile/Header/Shell.tsx` | 17 | `useLightboxControls` |
| `src/components/Post/Embed/ImageEmbed.tsx` | 5 | `useLightboxControls` |
| `src/view/com/profile/ProfileSubpageHeader.tsx` | 16 | `useLightboxControls` |
| `src/view/com/util/List.tsx` | 15 | `useLightbox` |

Use find-and-replace (case-sensitive) across those files:
- Find: `'#/state/lightbox'`
- Replace: `'#/features/lightbox/state'`

- [ ] **Step 3: Update references inside the still-existing lightbox files**

Two files in the old location still reference `#/state/lightbox` by path — update them too so Phase 1 is self-consistent:

- `src/view/com/lightbox/Lightbox.tsx:5`
- `src/view/com/lightbox/Lightbox.web.tsx:12`
- `src/view/com/lightbox/ImageViewing/index.tsx:47`

Same find-and-replace.

- [ ] **Step 4: Verify compile**

```bash
yarn typecheck
```

Expected: no errors referencing `#/state/lightbox`.

- [ ] **Step 5: Commit**

```bash
git add -u src/features/lightbox/state.tsx src/App.native.tsx src/App.web.tsx src/state/util.ts src/screens/Profile/Header/Shell.tsx src/components/Post/Embed/ImageEmbed.tsx src/view/com/profile/ProfileSubpageHeader.tsx src/view/com/util/List.tsx src/view/com/lightbox/Lightbox.tsx src/view/com/lightbox/Lightbox.web.tsx src/view/com/lightbox/ImageViewing/index.tsx
git commit -m "refactor(lightbox): move state module to features/lightbox/state"
```

---

### Task 2: Move the pager and image-item files into `features/lightbox/pager/`

**Files:**
- `src/view/com/lightbox/ImageViewing/index.tsx` → `src/features/lightbox/pager/ImagePager.tsx`
- `src/view/com/lightbox/ImageViewing/transforms.ts` → `src/features/lightbox/pager/transforms.ts`
- `src/view/com/lightbox/ImageViewing/@types/index.ts` → `src/features/lightbox/types.ts`
- `src/view/com/lightbox/ImageViewing/components/ImageItem/ImageItem.tsx` → `src/features/lightbox/pager/ImageItem/ImageItem.tsx`
- `src/view/com/lightbox/ImageViewing/components/ImageItem/ImageItem.ios.tsx` → `src/features/lightbox/pager/ImageItem/ImageItem.ios.tsx`
- `src/view/com/lightbox/ImageViewing/components/ImageItem/ImageItem.android.tsx` → `src/features/lightbox/pager/ImageItem/ImageItem.android.tsx`
- `src/view/com/lightbox/ImageViewing/components/ImageDefaultHeader.tsx` → **keep in place for now** (will be deleted in Task 10 when replaced)

- [ ] **Step 1: Create directories and move files**

```bash
mkdir -p src/features/lightbox/pager/ImageItem
git mv src/view/com/lightbox/ImageViewing/index.tsx src/features/lightbox/pager/ImagePager.tsx
git mv src/view/com/lightbox/ImageViewing/transforms.ts src/features/lightbox/pager/transforms.ts
git mv src/view/com/lightbox/ImageViewing/@types/index.ts src/features/lightbox/types.ts
git mv src/view/com/lightbox/ImageViewing/components/ImageItem/ImageItem.tsx src/features/lightbox/pager/ImageItem/ImageItem.tsx
git mv src/view/com/lightbox/ImageViewing/components/ImageItem/ImageItem.ios.tsx src/features/lightbox/pager/ImageItem/ImageItem.ios.tsx
git mv src/view/com/lightbox/ImageViewing/components/ImageItem/ImageItem.android.tsx src/features/lightbox/pager/ImageItem/ImageItem.android.tsx
```

- [ ] **Step 2: Fix internal imports inside moved files**

In `src/features/lightbox/pager/ImagePager.tsx`, update relative imports:
- `from './@types'` or `from './@types/index'` → `from '../types'`
- `from './transforms'` stays as is (still adjacent)
- `from './components/ImageItem/ImageItem'` → `from './ImageItem/ImageItem'`
- `from './components/ImageDefaultHeader'` → `from '../../../view/com/lightbox/ImageViewing/components/ImageDefaultHeader'`
  (yes, that's an ugly backward relative path — it is intentional and short-lived. `ImageDefaultHeader` is replaced in Task 10, at which point the import and the file both get deleted.)

In each `ImageItem*.tsx`, update:
- `from '../../@types'` or similar → `from '../../types'`
- `from '../../transforms'` → `from '../transforms'`

Use grep to double-check no stale relative paths remain:

```bash
grep -rn "@types\|ImageViewing\|components/ImageItem" src/features/lightbox
```

Expected: no hits except the intentional `ImageDefaultHeader` import noted above (if any).

- [ ] **Step 3: Fix the external import in `Lightbox.tsx` (still in old location)**

The native `Lightbox.tsx` wrapper at `src/view/com/lightbox/Lightbox.tsx:6` imports:
```tsx
import ImageView from './ImageViewing'
```
That path no longer resolves. Update to:
```tsx
import ImageView from '#/features/lightbox/pager/ImagePager'
```

- [ ] **Step 4: Verify compile**

```bash
yarn typecheck
```

Expected: no errors. If errors mention missing `@types` or `ImageViewing`, fix the relative path and re-run.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "refactor(lightbox): move pager files to features/lightbox/pager"
```

---

### Task 3: Move `Lightbox.tsx` / `Lightbox.web.tsx` into `features/lightbox/` and update shell imports

**Files:**
- `src/view/com/lightbox/Lightbox.tsx` → `src/features/lightbox/Lightbox.tsx`
- `src/view/com/lightbox/Lightbox.web.tsx` → `src/features/lightbox/Lightbox.web.tsx`
- Create: `src/features/lightbox/index.tsx` (platform-neutral re-export)
- Modify: `src/view/shell/index.tsx`, `src/view/shell/index.web.tsx`

- [ ] **Step 1: Move the two Lightbox files**

```bash
git mv src/view/com/lightbox/Lightbox.tsx src/features/lightbox/Lightbox.tsx
git mv src/view/com/lightbox/Lightbox.web.tsx src/features/lightbox/Lightbox.web.tsx
```

- [ ] **Step 2: Fix the import in the moved native `Lightbox.tsx`**

The file previously imported from `#/features/lightbox/pager/ImagePager` (set in Task 2). That import remains correct — verify it still reads:

```tsx
import ImageView from '#/features/lightbox/pager/ImagePager'
```

- [ ] **Step 3: Create `src/features/lightbox/index.tsx`**

This file re-exports `Lightbox` so consumers can import from the directory root. Bundler resolves `Lightbox.tsx` / `Lightbox.web.tsx` automatically.

```tsx
export {Lightbox} from './Lightbox'
```

- [ ] **Step 4: Update shell imports**

In `src/view/shell/index.tsx:22` and `src/view/shell/index.web.tsx:13`, change:

```tsx
import {Lightbox} from '#/view/com/lightbox/Lightbox'
```

to:

```tsx
import {Lightbox} from '#/features/lightbox'
```

- [ ] **Step 5: Remove the now-empty old directory**

```bash
# The only file that should remain is ImageDefaultHeader.tsx (deleted in Task 10).
ls src/view/com/lightbox/
# Expected output:
#   ImageViewing/
# with ImageViewing/components/ImageDefaultHeader.tsx as the only file inside.
```

If there are empty intermediate dirs (e.g. `@types/`, `components/ImageItem/`), remove them:

```bash
find src/view/com/lightbox -type d -empty -delete
```

- [ ] **Step 6: Verify compile and run the web build briefly**

```bash
yarn typecheck
yarn lint src/features/lightbox src/view/shell
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add -u src/features/lightbox src/view/shell/index.tsx src/view/shell/index.web.tsx
git commit -m "refactor(lightbox): move Lightbox shell to features/lightbox"
```

---

### Task 4: Smoke-test the migration

No code changes. This is a pure verification checkpoint before starting the reskin.

- [ ] **Step 1: Typecheck and lint full repo**

```bash
yarn typecheck
yarn lint
```

Expected: clean (or no NEW errors compared to `main`).

- [ ] **Step 2: Run Jest**

```bash
yarn test
```

Expected: pass rate identical to `main`.

- [ ] **Step 3: Visual smoke**

Run the app on iOS simulator and web. Open a post with an image, tap to open lightbox, swipe between images, tap Save + Share, tap close. Confirm everything behaves identically to `main` — this task ends the migration phase.

No commit (verification only). If anything broke, go back and fix before proceeding.

---

## Phase 2 — Shared chrome primitive

### Task 5: Add `CircleChromeButton`

The reusable translucent circle button used for `•••` and `✕` on both native and web.

**Files:**
- Create: `src/features/lightbox/chrome/CircleChromeButton.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/features/lightbox/chrome
```

- [ ] **Step 2: Write `CircleChromeButton.tsx`**

```tsx
import {type ComponentType} from 'react'
import {Pressable, type PressableProps, StyleSheet} from 'react-native'

import {HITSLOP_10} from '#/lib/constants'
import {type Props as IconProps} from '#/components/icons/common'

type Props = {
  icon: ComponentType<IconProps>
  label: string
  onPress?: PressableProps['onPress']
  testID?: string
}

const SIZE = 36
const BG = 'rgba(0, 0, 0, 0.45)'

export function CircleChromeButton({icon: Icon, label, onPress, testID}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={HITSLOP_10}
      onPress={onPress}
      testID={testID}
      style={({pressed}) => [styles.root, pressed && styles.pressed]}>
      <Icon width={20} fill="#fff" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
})
```

- [ ] **Step 3: Verify compile**

```bash
yarn typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/features/lightbox/chrome/CircleChromeButton.tsx
git commit -m "feat(lightbox): add CircleChromeButton primitive"
```

---

## Phase 3 — Native chrome rebuild

### Task 6: Add `ImageMenu` (the `•••` menu wrapper)

Uses `#/components/ContextMenu` so the menu renders as a floating card anchored under the trigger on iOS/Android. Triggered on single tap.

**Files:**
- Create: `src/features/lightbox/chrome/ImageMenu.tsx`

- [ ] **Step 1: Write `ImageMenu.tsx`**

```tsx
import {Pressable} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import * as ContextMenu from '#/components/ContextMenu'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {CircleChromeButton} from './CircleChromeButton'

type Props = {
  onPressShare: () => void
  onPressSave: () => void
}

export function ImageMenu({onPressShare, onPressSave}: Props) {
  const {_} = useLingui()

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        label={_(msg`Image options`)}
        contentLabel={_(msg`Image options`)}>
        {triggerProps => {
          if (triggerProps.IS_NATIVE) {
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={_(msg`Image options`)}
                onPress={() => triggerProps.control.open('full')}
                style={a.self_start}>
                <CircleChromeButton
                  icon={DotsIcon}
                  label={_(msg`Image options`)}
                />
              </Pressable>
            )
          }
          return (
            <CircleChromeButton
              icon={DotsIcon}
              label={_(msg`Image options`)}
            />
          )
        }}
      </ContextMenu.Trigger>

      <ContextMenu.Outer align="left">
        <ContextMenu.Item
          label={_(msg`Share image`)}
          onPress={onPressShare}>
          <ContextMenu.ItemIcon icon={ShareIcon} />
          <ContextMenu.ItemText>{_(msg`Share image`)}</ContextMenu.ItemText>
        </ContextMenu.Item>
        <ContextMenu.Item
          label={_(msg`Save image`)}
          onPress={onPressSave}>
          <ContextMenu.ItemIcon icon={DownloadIcon} />
          <ContextMenu.ItemText>{_(msg`Save image`)}</ContextMenu.ItemText>
        </ContextMenu.Item>
      </ContextMenu.Outer>
    </ContextMenu.Root>
  )
}
```

Note the exact API shapes are taken from `src/components/dms/MessageContextMenu.tsx`. If the `TriggerChildProps` narrowing by `IS_NATIVE` gives typescript trouble, cross-check that file.

- [ ] **Step 2: Verify compile**

```bash
yarn typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/lightbox/chrome/ImageMenu.tsx
git commit -m "feat(lightbox): add ImageMenu for share/save actions"
```

---

### Task 7: Add `Header` (top chrome row)

**Files:**
- Create: `src/features/lightbox/chrome/Header.tsx`

- [ ] **Step 1: Write `Header.tsx`**

```tsx
import {StyleSheet, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {CircleChromeButton} from './CircleChromeButton'
import {ImageMenu} from './ImageMenu'

type Props = {
  onRequestClose: () => void
  onPressShare: () => void
  onPressSave: () => void
}

export function Header({onRequestClose, onPressShare, onPressSave}: Props) {
  const {_} = useLingui()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.root,
        a.flex_row,
        a.justify_between,
        a.align_center,
        a.px_md,
        {paddingTop: insets.top + 8},
      ]}
      pointerEvents="box-none">
      <ImageMenu onPressShare={onPressShare} onPressSave={onPressSave} />
      <CircleChromeButton
        icon={CloseIcon}
        label={_(msg`Close image`)}
        onPress={onRequestClose}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
})
```

- [ ] **Step 2: Verify compile**

```bash
yarn typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/lightbox/chrome/Header.tsx
git commit -m "feat(lightbox): add new Header with ••• menu and close"
```

---

### Task 8: Add `PagerDots`

**Files:**
- Create: `src/features/lightbox/chrome/PagerDots.tsx`

- [ ] **Step 1: Write `PagerDots.tsx`**

```tsx
import {StyleSheet, View} from 'react-native'

import {atoms as a} from '#/alf'

type Props = {
  count: number
  activeIndex: number
}

const DOT = 6
const GAP = 4

export function PagerDots({count, activeIndex}: Props) {
  if (count <= 1) return null
  return (
    <View style={[a.flex_row, a.justify_center, a.align_center, styles.row]}>
      {Array.from({length: count}).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: GAP,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  active: {
    backgroundColor: '#fff',
  },
  inactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
})
```

- [ ] **Step 2: Verify compile**

```bash
yarn typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/lightbox/chrome/PagerDots.tsx
git commit -m "feat(lightbox): add PagerDots indicator"
```

---

### Task 9: Add `Footer` (alt text + pager dots)

**Files:**
- Create: `src/features/lightbox/chrome/Footer.tsx`

- [ ] **Step 1: Write `Footer.tsx`**

```tsx
import {useRef} from 'react'
import {LayoutAnimation, Pressable, ScrollView, StyleSheet, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {PagerDots} from './PagerDots'

type Props = {
  altText: string | undefined
  isAltExpanded: boolean
  onToggleAltExpanded: () => void
  imageCount: number
  activeIndex: number
}

export function Footer({
  altText,
  isAltExpanded,
  onToggleAltExpanded,
  imageCount,
  activeIndex,
}: Props) {
  const {_} = useLingui()
  const insets = useSafeAreaInsets()
  const isMomentumScrolling = useRef(false)

  return (
    <View
      style={[styles.root, {paddingBottom: insets.bottom + 8}]}
      pointerEvents="box-none">
      {altText ? (
        <View style={[a.mx_md, a.mb_sm, styles.altWrap]}>
          <ScrollView
            scrollEnabled={isAltExpanded}
            onMomentumScrollBegin={() => {
              isMomentumScrolling.current = true
            }}
            onMomentumScrollEnd={() => {
              isMomentumScrolling.current = false
            }}
            contentContainerStyle={[a.px_md, a.py_sm]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={_(msg`Expand alt text`)}
              onPress={() => {
                if (isMomentumScrolling.current) return
                LayoutAnimation.configureNext({
                  duration: 450,
                  update: {type: 'spring', springDamping: 1},
                })
                onToggleAltExpanded()
              }}>
              <Text
                emoji
                selectable
                style={[a.text_sm, styles.altText]}
                numberOfLines={isAltExpanded ? undefined : 3}>
                {altText}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}
      <PagerDots count={imageCount} activeIndex={activeIndex} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  altWrap: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  altText: {
    color: '#fff',
  },
})
```

- [ ] **Step 2: Verify compile**

```bash
yarn typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/lightbox/chrome/Footer.tsx
git commit -m "feat(lightbox): add new Footer with alt text and pager dots"
```

---

### Task 10: Wire new chrome into `ImagePager.tsx` and delete old chrome

Replace the two chrome blocks currently in `src/features/lightbox/pager/ImagePager.tsx` at lines ~417-433. Delete `ImageDefaultHeader.tsx` and the `LightboxFooter` function inside `ImagePager.tsx`.

**Files:**
- Modify: `src/features/lightbox/pager/ImagePager.tsx`
- Delete: `src/view/com/lightbox/ImageViewing/components/ImageDefaultHeader.tsx`
- Delete: the now-empty `src/view/com/lightbox/` tree

- [ ] **Step 1: Open `ImagePager.tsx` and find the chrome block**

Near line 416 there is a `<View style={styles.controls}>` with two animated children: `ImageDefaultHeader` and `LightboxFooter`. Replace both with the new `Header` and `Footer`.

Replace this block:

```tsx
<View style={styles.controls}>
  <Animated.View
    style={animatedHeaderStyle}
    renderToHardwareTextureAndroid>
    <ImageDefaultHeader onRequestClose={handleRequestClose} />
  </Animated.View>
  <Animated.View
    style={animatedFooterStyle}
    renderToHardwareTextureAndroid={!isAltExpanded}>
    <LightboxFooter
      images={images}
      index={imageIndex}
      isAltExpanded={isAltExpanded}
      toggleAltExpanded={() => setIsAltExpanded(e => !e)}
      onPressSave={onPressSave}
      onPressShare={onPressShare}
    />
  </Animated.View>
</View>
```

With:

```tsx
<View style={styles.controls} pointerEvents="box-none">
  <Animated.View
    style={animatedHeaderStyle}
    pointerEvents="box-none"
    renderToHardwareTextureAndroid>
    <Header
      onRequestClose={handleRequestClose}
      onPressShare={() => onPressShare(images[imageIndex].uri)}
      onPressSave={() => onPressSave(images[imageIndex].uri)}
    />
  </Animated.View>
  <Animated.View
    style={animatedFooterStyle}
    pointerEvents="box-none"
    renderToHardwareTextureAndroid={!isAltExpanded}>
    <Footer
      altText={images[imageIndex].alt}
      isAltExpanded={isAltExpanded}
      onToggleAltExpanded={() => setIsAltExpanded(e => !e)}
      imageCount={images.length}
      activeIndex={imageIndex}
    />
  </Animated.View>
</View>
```

- [ ] **Step 2: Update imports at the top of `ImagePager.tsx`**

Remove:
```tsx
import ImageDefaultHeader from './components/ImageDefaultHeader'
// (wherever the old path sits — or the import added in Task 2 Step 2)
```

Add:
```tsx
import {Footer} from '../chrome/Footer'
import {Header} from '../chrome/Header'
```

- [ ] **Step 3: Delete the `LightboxFooter` function and its styles**

Inside `ImagePager.tsx`, find `function LightboxFooter(` (~line 610) and delete the entire function plus any type imports it uniquely required (`Button`, `FontAwesomeIcon`, `Trans`, `s`, `colors`, `ScrollView` — but ONLY if they are not used elsewhere in the file; verify with grep after deletion).

Also remove unused styles: `footerScrollView`, `footerText`, `footerBtns`, `footerBtn` from the `StyleSheet.create` at the bottom of the file.

Also remove this line near the top:
```tsx
import ImageDefaultHeader from ...
```

- [ ] **Step 4: Delete the old `ImageDefaultHeader.tsx` file and empty dirs**

```bash
git rm src/view/com/lightbox/ImageViewing/components/ImageDefaultHeader.tsx
find src/view/com/lightbox -type d -empty -delete
```

Expected: `src/view/com/lightbox/` is gone entirely.

- [ ] **Step 5: Verify compile and lint**

```bash
yarn typecheck
yarn lint src/features/lightbox
```

Expected: clean. If typescript complains about unused imports in `ImagePager.tsx`, remove them.

- [ ] **Step 6: Smoke test on native**

Run on iOS simulator. Open lightbox. Confirm:
- `•••` menu renders top-left as a translucent dark circle
- `✕` close renders top-right
- Tapping `•••` opens a floating menu with Share image + Save image
- Tapping Share or Save calls through (may show toast / share sheet)
- Alt text strip appears at bottom with correct translucent bg
- Pager dots appear at very bottom when image count > 1
- Single tap on image still toggles chrome visibility
- Swipe-down-to-dismiss still works
- Pinch/zoom still works

- [ ] **Step 7: Commit**

```bash
git add -u
git commit -m "feat(lightbox): replace native chrome with new header/footer"
```

---

## Phase 4 — Web chrome reskin

### Task 11: Swap web chrome buttons to `CircleChromeButton`

**Files:**
- Modify: `src/features/lightbox/Lightbox.web.tsx`

- [ ] **Step 1: Locate the menu trigger (~line 251-296) and close button (~line 297-312)**

Open `src/features/lightbox/Lightbox.web.tsx`. Find the existing `Menu.Trigger` that renders the `•••` button, and the existing close `Button`.

- [ ] **Step 2: Replace the menu trigger's visual child with `CircleChromeButton`**

Add imports at the top of the file:

```tsx
import {CircleChromeButton} from './chrome/CircleChromeButton'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
```

Replace the existing `Menu.Trigger` render child. The radix `Menu.Trigger` passes `props` to be spread on a Pressable-like element. Wrap `CircleChromeButton` in a `Pressable` that takes those props:

```tsx
<Menu.Trigger label={_(msg`Image options`)}>
  {({props}) => (
    <Pressable {...props} accessibilityLabel={_(msg`Image options`)}>
      <CircleChromeButton icon={DotsIcon} label={_(msg`Image options`)} />
    </Pressable>
  )}
</Menu.Trigger>
```

The nested Pressable pattern matches what `src/components/dms/MessageContextMenu.tsx` does (radix gives us a button-like target, we render inside it). The inner CircleChromeButton's Pressable won't hijack gestures because its own `onPress` is undefined — it's purely visual here.

- [ ] **Step 3: Replace the close button visually**

Find the close `Button` at lines ~297-312. Replace with:

```tsx
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'

<CircleChromeButton
  icon={CloseIcon}
  label={_(msg`Close image`)}
  onPress={onClose}
/>
```

(The existing onClose handler and a11y labels already exist in the file — reuse them.)

- [ ] **Step 4: Verify compile and visual**

```bash
yarn typecheck
yarn web
```

Open a post with an image in the browser, open lightbox, confirm buttons match native's translucent dark grey treatment. Verify left/right chevron navigation still works. Verify menu still opens on `•••` click.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(lightbox): reskin web chrome buttons to match native"
```

---

### Task 12: Add `Share image` menu item on web

**Files:**
- Modify: `src/features/lightbox/Lightbox.web.tsx`

- [ ] **Step 1: Locate the existing `Menu.Item` list**

In the same region as Task 11 (around the menu trigger), there's a `Menu.Outer` with a single `Menu.Item` labeled "Download image" (or similar). Find it.

- [ ] **Step 2: Add a `Share image` item above or below `Download image`**

Add imports at the top if missing:

```tsx
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
```

Add the new item:

```tsx
<Menu.Item
  label={_(msg`Share image`)}
  onPress={async () => {
    const uri = images[imageIndex].uri
    if (navigator.share) {
      try {
        await navigator.share({url: uri})
      } catch {
        // user cancelled or unsupported — silently fall through
      }
    } else {
      await navigator.clipboard.writeText(uri)
      // Toast.show would be appropriate here — check if Toast is already imported
    }
  }}>
  <Menu.ItemText>{_(msg`Share image`)}</Menu.ItemText>
  <Menu.ItemIcon icon={ShareIcon} />
</Menu.Item>
```

Adapt variable names (`images`, `imageIndex`) to whatever the existing web component uses — check the file for the current active-index variable name. If the file already has a `Toast` import, use it on the clipboard fallback.

- [ ] **Step 3: Verify**

```bash
yarn typecheck
yarn web
```

In browser: open lightbox, click `•••`, confirm menu shows both Share image and Download image. Click Share — confirm native share sheet prompt (on supported browsers) or clipboard fallback.

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "feat(lightbox): add Share image menu item on web"
```

---

### Task 13: Restyle web alt-text strip

**Files:**
- Modify: `src/features/lightbox/Lightbox.web.tsx`

- [ ] **Step 1: Find the alt text block (~line 227-245 in the original file)**

Currently wrapped in a `View` with `t.atoms.bg` (theme bg). Replace with translucent dark treatment matching native.

- [ ] **Step 2: Update the wrapping View's style**

Find:

```tsx
<View style={[a.px_4xl, a.py_2xl, t.atoms.bg, delayedFadeInAnim]}>
```

Replace the theme bg with the translucent black background and keep the fade-in animation:

```tsx
<View style={[a.px_4xl, a.py_2xl, {backgroundColor: 'rgba(0, 0, 0, 0.45)'}, delayedFadeInAnim]}>
```

And update the text color on the inner `<Text>` to white. If the existing Text relies on `t.atoms.text`, change it to `{color: '#fff'}`.

- [ ] **Step 3: Verify**

```bash
yarn typecheck
yarn web
```

Open a lightbox on an image with alt text; confirm strip reads white-on-translucent-black and expand/collapse still works.

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "feat(lightbox): restyle web alt-text strip to match"
```

---

## Phase 5 — Final verification

### Task 14: Full verification pass

No new commits — pure QA.

- [ ] **Step 1: Full type + lint + test**

```bash
yarn typecheck && yarn lint && yarn test
```

Expected: exit code 0 on all three.

- [ ] **Step 2: iOS simulator smoke**

Open a single-image post → lightbox → tap image to toggle chrome → tap `•••` → menu appears anchored top-left → Share image → system share sheet → dismiss → Save image → confirm save → close via `✕`.
Open a multi-image post → confirm pager dots appear bottom-center → swipe between images → confirm dots update → swipe down to dismiss.
Open an image with alt text → confirm strip appears with translucent bg → tap to expand → tap to collapse.

- [ ] **Step 3: Android emulator smoke**

Same checklist as Step 2.

- [ ] **Step 4: Web smoke**

Open lightbox in browser → verify `•••` and `✕` buttons match native translucent style → verify chevron nav still works → verify Share + Download both in menu → verify alt text strip → verify keyboard esc to close still works.

- [ ] **Step 5: If everything passes, the plan is complete**

Push the branch and open a PR referencing APP-2046 with a brief summary linking back to the spec.

---

## Cross-task references

- **CircleChromeButton** (Task 5) is used in: Header (Task 7), ImageMenu (Task 6), Lightbox.web.tsx (Task 11).
- **Header** (Task 7) and **Footer** (Task 9) are wired into ImagePager via Task 10.
- **ImageMenu** (Task 6) depends on CircleChromeButton (Task 5).
- **PagerDots** (Task 8) is consumed by Footer (Task 9).
- **State module path** set in Task 1 is referenced by Lightbox.tsx and Lightbox.web.tsx (after their moves in Task 3).

Tasks within a phase must be done in order; phases must be done in order.
