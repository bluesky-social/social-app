# Testing Approach

Our additions to the social-app (stats dashboard, persona chat screens) follow the existing testing conventions rather than introducing new patterns.

## Existing Patterns in social-app

| Layer | Framework | What's tested | Our usage |
|-------|-----------|---------------|-----------|
| Unit tests | Jest (`pnpm test`) | Pure logic: utilities, parsers, state classes | Yes - test our data layer |
| E2E flows | Maestro (YAML) | Full mobile user flows (native only) | No - requires native builds, defeats web-first workflow |
| Component render tests | Not used | (no `@testing-library/react-native` in codebase) | No - not the convention here |

## What We Test

### 1. API Client Module

Unit test the fetch wrapper that talks to our backend:

- Correct URL construction (`/stats/{window}`, `/personas/{handle}/chat`)
- `X-Api-Key` header always included
- Error handling (401, 500, network failure)
- Response parsing

### 2. SSE Event Parsing

Unit test the EventSource message handler:

- Parse `snapshot` events into typed stats objects
- Parse `update` events (incremental stats)
- Parse `token` events (persona chat streaming)
- Handle malformed events gracefully

### 3. Data Transforms

Unit test formatting/display logic:

- Number formatting (e.g., 2241 posts/min display)
- Velocity sparkline data preparation (array of rates to chart-ready format)
- Language breakdown percentages
- Relative time formatting for corpus freshness

### 4. TanStack Query Hooks (optional)

If complex enough to warrant testing, test with a QueryClient wrapper:

- Cache invalidation behavior
- Refetch-on-focus behavior
- Optimistic updates for chat messages

## What We Don't Test

- **Component rendering** - no precedent, and the web dev server gives immediate visual feedback
- **Navigation flows** - Maestro-style E2E, requires native; manual testing via web browser
- **Styling/layout** - visual verification in browser; no snapshot tests

## Conventions

- Test files live next to source: `src/features/bsky-stats/__tests__/api.test.ts`
- Use `describe`/`it` from `@jest/globals`
- Mock modules with `jest.mock()`
- Mock `fetch` globally for API tests
- Use fake timers (`jest.useFakeTimers()`) for interval/timeout logic

## Internationalization

All user-facing strings must use Lingui macros per `docs/localization.md`:

```tsx
// In components:
import {Trans} from '@lingui/react/macro'
<Text><Trans>Posts per minute</Trans></Text>

// In variables/props:
import {useLingui} from '@lingui/react/macro'
const {t} = useLingui()
<Text accessibilityLabel={t`Stats dashboard`}>...</Text>
```

Run `pnpm intl:extract` after adding strings (but don't run `intl:compile` - CI handles that).
