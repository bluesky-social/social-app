# CLAUDE.md - Bluesky Social App Development Guide

This document provides guidance for working effectively in the Bluesky Social app codebase.

## Project Overview

Bluesky Social is a cross-platform social media application built with React Native and Expo. It runs on iOS, Android, and Web, connecting to the AT Protocol (atproto) decentralized social network.

**Tech Stack:**
- React Native 0.81 with Expo 54
- TypeScript
- React Navigation for routing
- TanStack Query (React Query) for data fetching
- Lingui for internationalization
- Custom design system called ALF (Application Layout Framework)

## Essential Commands

```bash
# Development
yarn start              # Start Expo dev server
yarn web                # Start web version
yarn android            # Run on Android
yarn ios                # Run on iOS

# Testing & Quality
yarn test               # Run Jest tests
yarn lint               # Run ESLint
yarn typecheck          # Run TypeScript type checking

# Internationalization
yarn intl:extract       # Extract translation strings
yarn intl:compile       # Compile translations for runtime

# Build
yarn build-web          # Build web version
yarn prebuild           # Generate native projects
```

## Project Structure

```
src/
├── alf/                    # Design system (ALF) - themes, atoms, tokens
├── components/             # Shared UI components (Button, Dialog, Menu, etc.)
├── screens/                # Full-page screen components (newer pattern)
├── view/
│   ├── screens/            # Full-page screens (legacy location)
│   ├── com/                # Reusable view components
│   └── shell/              # App shell (navigation bars, tabs)
├── state/
│   ├── queries/            # TanStack Query hooks
│   ├── preferences/        # User preferences (React Context)
│   ├── session/            # Authentication state
│   └── persisted/          # Persistent storage layer
├── lib/                    # Utilities, constants, helpers
├── locale/                 # i18n configuration and language files
└── Navigation.tsx          # Main navigation configuration
```

## Styling System (ALF)

ALF is the custom design system. It uses Tailwind-inspired naming with underscores instead of hyphens.

### Basic Usage

```tsx
import {atoms as a, useTheme} from '#/alf'

function MyComponent() {
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.gap_md, a.p_lg, t.atoms.bg]}>
      <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
        Hello
      </Text>
    </View>
  )
}
```

### Key Concepts

**Static Atoms** - Theme-independent styles imported from `atoms`:
```tsx
import {atoms as a} from '#/alf'
// a.flex_row, a.p_md, a.gap_sm, a.rounded_md, a.text_lg, etc.
```

**Theme Atoms** - Theme-dependent colors from `useTheme()`:
```tsx
const t = useTheme()
// t.atoms.bg, t.atoms.text, t.atoms.border_contrast_low, etc.
// t.palette.primary_500, t.palette.negative_400, etc.
```

**Platform Utilities** - For platform-specific styles:
```tsx
import {web, native, ios, android, platform} from '#/alf'

const styles = [
  a.p_md,
  web({cursor: 'pointer'}),
  native({paddingBottom: 20}),
  platform({ios: {...}, android: {...}, web: {...}}),
]
```

**Breakpoints** - Responsive design:
```tsx
import {useBreakpoints} from '#/alf'

const {gtPhone, gtMobile, gtTablet} = useBreakpoints()
if (gtMobile) {
  // Tablet or desktop layout
}
```

### Naming Conventions

- Spacing: `xxs`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl` (t-shirt sizes)
- Text: `text_xs`, `text_sm`, `text_md`, `text_lg`, `text_xl`
- Gaps/Padding: `gap_sm`, `p_md`, `px_lg`, `py_xl`
- Flex: `flex_row`, `flex_1`, `align_center`, `justify_between`
- Borders: `border`, `border_t`, `rounded_md`, `rounded_full`

## Component Patterns

### Dialog Component

Dialogs use a bottom sheet on native and a modal on web. Use `useDialogControl()` hook to manage state.

```tsx
import * as Dialog from '#/components/Dialog'

function MyFeature() {
  const control = Dialog.useDialogControl()

  return (
    <>
      <Button label="Open" onPress={control.open}>
        <ButtonText>Open Dialog</ButtonText>
      </Button>

      <Dialog.Outer control={control}>
        <Dialog.Handle />  {/* Native drag handle */}
        <Dialog.ScrollableInner label={_(msg`My Dialog`)}>
          <Dialog.Header>
            <Dialog.HeaderText>Title</Dialog.HeaderText>
          </Dialog.Header>

          <Text>Dialog content here</Text>

          <Button label="Close" onPress={() => control.close()}>
            <ButtonText>Close</ButtonText>
          </Button>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
```

### Menu Component

Menus render as a dropdown on web and a bottom sheet dialog on native.

```tsx
import * as Menu from '#/components/Menu'

function MyMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger label="Open menu">
        {({props}) => (
          <Button {...props} label="Menu">
            <ButtonIcon icon={DotsHorizontal} />
          </Button>
        )}
      </Menu.Trigger>

      <Menu.Outer>
        <Menu.Group>
          <Menu.Item label="Edit" onPress={handleEdit}>
            <Menu.ItemIcon icon={Pencil} />
            <Menu.ItemText>Edit</Menu.ItemText>
          </Menu.Item>
          <Menu.Item label="Delete" onPress={handleDelete}>
            <Menu.ItemIcon icon={Trash} />
            <Menu.ItemText>Delete</Menu.ItemText>
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
```

### Button Component

```tsx
import {Button, ButtonText, ButtonIcon} from '#/components/Button'

// Solid primary button (most common)
<Button label="Save" onPress={handleSave} color="primary" size="large">
  <ButtonText>Save</ButtonText>
</Button>

// With icon
<Button label="Share" onPress={handleShare} color="secondary" size="small">
  <ButtonIcon icon={Share} />
  <ButtonText>Share</ButtonText>
</Button>

// Icon-only button
<Button label="Close" onPress={handleClose} color="secondary" size="small" shape="round">
  <ButtonIcon icon={X} />
</Button>

// Ghost variant (deprecated - use color prop)
<Button label="Cancel" variant="ghost" color="secondary" size="small">
  <ButtonText>Cancel</ButtonText>
</Button>
```

**Button Props:**
- `color`: `'primary'` | `'secondary'` | `'negative'` | `'primary_subtle'` | `'negative_subtle'`
- `size`: `'tiny'` | `'small'` | `'large'`
- `shape`: `'default'` (pill) | `'round'` | `'square'` | `'rectangular'`
- `variant`: `'solid'` | `'outline'` | `'ghost'` (deprecated, use `color`)

### Typography

```tsx
import {Text, H1, H2, P} from '#/components/Typography'

<H1 style={[a.text_xl, a.font_bold]}>Heading</H1>
<P>Paragraph text with default styling.</P>
<Text style={[a.text_sm, t.atoms.text_contrast_medium]}>Custom text</Text>

// For text with emoji, add the emoji prop
<Text emoji>Hello! 👋</Text>
```

### TextField

```tsx
import * as TextField from '#/components/forms/TextField'

<TextField.LabelText>Email</TextField.LabelText>
<TextField.Root>
  <TextField.Icon icon={AtSign} />
  <TextField.Input
    label="Email address"
    placeholder="you@example.com"
    defaultValue={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    autoCapitalize="none"
  />
</TextField.Root>
```

## Internationalization (i18n)

All user-facing strings must be wrapped for translation using Lingui.

```tsx
import {msg, Trans, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

function MyComponent() {
  const {_} = useLingui()

  // Simple strings - use msg() with _() function
  const title = _(msg`Settings`)
  const errorMessage = _(msg`Something went wrong`)

  // Strings with variables
  const greeting = _(msg`Hello, ${name}!`)

  // Pluralization
  const countLabel = _(plural(count, {
    one: '# item',
    other: '# items',
  }))

  // JSX content - use Trans component
  return (
    <Text>
      <Trans>Welcome to <Text style={a.font_bold}>Bluesky</Text></Trans>
    </Text>
  )
}
```

**Commands:**
```bash
yarn intl:extract    # Extract new strings to locale files
yarn intl:compile    # Compile for runtime (required after changes)
```

## State Management

### TanStack Query (Data Fetching)

```tsx
// src/state/queries/profile.ts
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'

// Query key pattern
const RQKEY_ROOT = 'profile'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

// Query hook
export function useProfileQuery({did}: {did: string}) {
  const agent = useAgent()

  return useQuery({
    queryKey: RQKEY(did),
    queryFn: async () => {
      const res = await agent.getProfile({actor: did})
      return res.data
    },
    staleTime: STALE.MINUTES.FIVE,
    enabled: !!did,
  })
}

// Mutation hook
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data) => {
      // Update logic
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: RQKEY(variables.did)})
    },
  })
}
```

**Stale Time Constants** (from `src/state/queries/index.ts`):
```tsx
STALE.SECONDS.FIFTEEN  // 15 seconds
STALE.MINUTES.ONE      // 1 minute
STALE.MINUTES.FIVE     // 5 minutes
STALE.HOURS.ONE        // 1 hour
STALE.INFINITY         // Never stale
```

### Preferences (React Context)

```tsx
// Simple boolean preference pattern
import {useAutoplayDisabled, useSetAutoplayDisabled} from '#/state/preferences'

function SettingsScreen() {
  const autoplayDisabled = useAutoplayDisabled()
  const setAutoplayDisabled = useSetAutoplayDisabled()

  return (
    <Toggle
      value={autoplayDisabled}
      onValueChange={setAutoplayDisabled}
    />
  )
}
```

### Session State

```tsx
import {useSession, useAgent} from '#/state/session'

function MyComponent() {
  const {hasSession, currentAccount} = useSession()
  const agent = useAgent()

  if (!hasSession) {
    return <LoginPrompt />
  }

  // Use agent for API calls
  const response = await agent.getProfile({actor: currentAccount.did})
}
```

## Navigation

Navigation uses React Navigation with type-safe route parameters.

```tsx
// Screen component
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type CommonNavigatorParams} from '#/lib/routes/types'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Profile'>

export function ProfileScreen({route, navigation}: Props) {
  const {name} = route.params  // Type-safe params

  return (
    <Layout.Screen>
      {/* Screen content */}
    </Layout.Screen>
  )
}

// Programmatic navigation
import {useNavigation} from '@react-navigation/native'

const navigation = useNavigation()
navigation.navigate('Profile', {name: 'alice.bsky.social'})

// Or use the navigate helper
import {navigate} from '#/Navigation'
navigate('Profile', {name: 'alice.bsky.social'})
```

## Platform-Specific Code

Use file extensions for platform-specific implementations:

```
Component.tsx          # Shared/default
Component.web.tsx      # Web-only
Component.native.tsx   # iOS + Android
Component.ios.tsx      # iOS-only
Component.android.tsx  # Android-only
```

Example from Dialog:
- `src/components/Dialog/index.tsx` - Native (uses BottomSheet)
- `src/components/Dialog/index.web.tsx` - Web (uses modal with Radix primitives)

Platform detection:
```tsx
import {IS_WEB, IS_NATIVE, IS_IOS, IS_ANDROID} from '#/env'

if (IS_NATIVE) {
  // Native-specific logic
}
```

## Import Aliases

Always use the `#/` alias for absolute imports:

```tsx
// Good
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'

// Avoid
import {useSession} from '../../../state/session'
```

## Footguns

Common pitfalls to avoid in this codebase:

### Dialog Close Callback (Critical)

**Always use `control.close(() => ...)` when performing actions after closing a dialog.** The callback ensures the action runs after the dialog's close animation completes. Failing to do this causes race conditions with React state updates.

```tsx
// WRONG - causes bugs with state updates, navigation, opening other dialogs
const onConfirm = () => {
  control.close()
  navigation.navigate('Home')  // May race with dialog animation
}

// WRONG - same problem
const onConfirm = () => {
  control.close()
  otherDialogControl.open()  // Will likely fail or cause visual glitches
}

// CORRECT - action runs after dialog fully closes
const onConfirm = () => {
  control.close(() => {
    navigation.navigate('Home')
  })
}

// CORRECT - opening another dialog after close
const onConfirm = () => {
  control.close(() => {
    otherDialogControl.open()
  })
}

// CORRECT - state updates after close
const onConfirm = () => {
  control.close(() => {
    setSomeState(newValue)
    onCallback?.()
  })
}
```

This applies to:
- Navigation (`navigation.navigate()`, `navigation.push()`)
- Opening other dialogs or menus
- State updates that affect UI (`setState`, `queryClient.invalidateQueries`)
- Callbacks passed from parent components

The Menu component on iOS specifically uses this pattern - see `src/components/Menu/index.tsx:151`.

### Controlled vs Uncontrolled Inputs

Prefer `defaultValue` over `value` for TextInput on the old architecture:

```tsx
// Preferred - uncontrolled
<TextField.Input
  defaultValue={initialEmail}
  onChangeText={setEmail}
/>

// Avoid when possible - controlled (can cause performance issues)
<TextField.Input
  value={email}
  onChangeText={setEmail}
/>
```

### Platform-Specific Behavior

Some components behave differently across platforms:
- `Dialog.Handle` - Only renders on native (drag handle for bottom sheet)
- `Dialog.Close` - Only renders on web (X button)
- `Menu.Divider` - Only renders on web
- `Menu.ContainerItem` - Only works on native

Always test on multiple platforms when using these components.

### React Compiler is Enabled

This codebase uses React Compiler, so **don't proactively add `useMemo` or `useCallback`**. The compiler handles memoization automatically.

```tsx
// UNNECESSARY - React Compiler handles this
const handlePress = useCallback(() => {
  doSomething()
}, [doSomething])

// JUST WRITE THIS
const handlePress = () => {
  doSomething()
}
```

Only use `useMemo`/`useCallback` when you have a specific reason, such as:
- The value is immediately used in an effect's dependency array
- You're passing a callback to a non-React library that needs referential stability

## Best Practices

1. **Accessibility**: Always provide `label` prop for interactive elements, use `accessibilityHint` where helpful

2. **Translations**: Wrap ALL user-facing strings with `msg()` or `<Trans>`

3. **Styling**: Combine static atoms with theme atoms, use platform utilities for platform-specific styles

4. **State**: Use TanStack Query for server state, React Context for UI preferences

5. **Components**: Check if a component exists in `#/components/` before creating new ones

6. **Types**: Define explicit types for props, use `NativeStackScreenProps` for screens

7. **Testing**: Components should have `testID` props for E2E testing

## Key Files Reference

| Purpose | Location |
|---------|----------|
| Theme definitions | `src/alf/themes.ts` |
| Design tokens | `src/alf/tokens.ts` |
| Static atoms | `src/alf/atoms.ts` (extends `@bsky.app/alf`) |
| Navigation config | `src/Navigation.tsx` |
| Route definitions | `src/routes.ts` |
| Route types | `src/lib/routes/types.ts` |
| Query hooks | `src/state/queries/*.ts` |
| Session state | `src/state/session/index.tsx` |
| i18n setup | `src/locale/i18n.ts` |
