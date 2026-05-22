# Implementation Order

Incremental build-up: each phase produces something testable in the web browser before moving on.

## Phase 1: API Client + Plumbing

Standalone data layer — no UI yet, but fully testable via Jest and browser console.

1. **API client module** — `src/lib/api/bsky-stats.ts`
   - Typed fetch wrapper for our backend (`/stats/{window}`, `/personas/...`, `/personas/{handle}/chat`)
   - `X-Api-Key` header injection
   - Error handling (network, 401, 500)
   - Backend base URL from env/config

2. **SSE client module** — `src/lib/api/bsky-stats-sse.ts`
   - EventSource wrapper for live stats stream
   - Parse `snapshot`, `update`, `token` event types into typed objects
   - Auto-reconnect with backoff
   - Cleanup on unmount

3. **TanStack Query hooks** — `src/state/queries/bsky-stats.ts`
   - `useStatsQuery(window)` — fetches `/stats/{window}`, refetches on focus
   - `useStatsStream()` — SSE hook that updates query cache in real-time
   - `usePersonaStatus(handle)` — polls `/personas/{handle}/status`
   - `usePersonaChat(handle)` — fetches conversation history
   - `usePersonaChatMutation(handle)` — sends message, handles streaming response

4. **Unit tests** — `src/lib/api/__tests__/bsky-stats.test.ts`
   - URL construction, header injection, error paths
   - SSE event parsing (snapshot, update, token, malformed)
   - Number formatting, velocity data transforms

**Test review:** API client logic, SSE parsing, data transforms. Focus: correctness of URL construction, header injection, error handling, event deserialization. All pure-logic tests — no mocking React.

**Exit criterion:** tests pass (`pnpm test`), hooks importable.

## Phase 2: Stats Dashboard Screen

First visible feature — a new screen showing live firehose stats.

5. **Route registration**
   - Add `BskyStats` to `CommonNavigatorParams` in `src/lib/routes/types.ts`
   - Register screen in `src/Navigation.tsx` (in each tab navigator that needs it)

6. **Stats dashboard screen** — `src/screens/BskyStats/`
   - `index.tsx` — main screen component
   - Counts row: posts/min, unique posters, likes, reposts, replies (per selected window)
   - Window selector: tabs for 1m / 5m / 10m
   - Top-N lists: top liked, top reposted, top replied (link to post threads)
   - Language breakdown: horizontal bar chart or simple ranked list
   - Velocity sparkline: posting rate over last hour (simple line/area chart)
   - SSE connection: stats update live every ~2s

7. **Nav entry point**
   - Add a temporary entry point to reach the screen (e.g. button in Discover tab header, or a route you can type in the URL bar during dev)
   - Decide on permanent nav placement later

**Test review:** Revisit Phase 1 tests now that we've seen real data flowing. Add cases for: edge-case stat values (zeros, very large numbers), SSE reconnection behavior, query cache invalidation after window switch. Manual browser verification that live updates don't flicker or accumulate stale data.

**Exit criterion:** screen loads in browser, shows live stats from the backend, updates in real-time.

## Phase 3: Persona Chat — Registration + Status

Wire up persona creation so we can start chatting.

8. **Persona registration action** — `src/state/queries/bsky-stats.ts` (extend)
   - `useRegisterPersonaMutation()` — `POST /personas` with a handle
   - Invalidates persona status query on success

9. **Profile menu entry point** — modify `src/view/com/profile/ProfileMenu.tsx`
   - Add "Chat with AI {displayName}" menu item
   - On tap: register persona (if not already), navigate to chat screen
   - Conditional: only show when backend is configured/reachable

**Test review:** Add tests for persona registration mutation — success, duplicate handle, network failure. Verify status polling transitions (loading → ready → error) and that the UI responds correctly to each state.

**Exit criterion:** tap three-dot menu on a profile → "Chat with AI" item appears → persona registers on backend.

## Phase 4: Persona Chat Screen

The conversation UI.

10. **Chat screen** — `src/screens/BskyStats/PersonaChat.tsx`
    - Route: `PersonaChat` with `{handle: string}` param
    - Message thread: scrollable list of user/AI messages
    - Compose bar: text input + send button
    - Streaming response: AI reply appears token-by-token via SSE
    - Persona status indicator: loading spinner if corpus still fetching
    - Debug info: corpus freshness timestamp in small type

11. **Chat inbox screen** — `src/screens/BskyStats/PersonaChatList.tsx`
    - List of active persona chats (personas with conversation history)
    - Each row: avatar, display name, last message preview
    - Tap → navigate to PersonaChat screen
    - "Clear chat" swipe action or long-press menu

12. **Chat inbox nav entry**
    - Add nav item in sidebar/bottom tab area (similar to DM icon placement)
    - Badge with unread/active count (optional, low priority)

**Test review:** Add tests for chat mutation — message send, streaming token accumulation, error mid-stream. Test conversation history fetch and cache behavior (does sending a message optimistically update the list?). Manual browser verification of streaming UX: first-token latency, partial render, completion.

**Exit criterion:** can have a full streaming conversation with an AI persona, navigate between chat list and individual chats.

## Phase 5: Polish + Integration

13. **Lingui i18n** — wrap all user-facing strings in `<Trans>` / `t` macros, run `pnpm intl:extract`
14. **Theming** — verify light/dark mode, match existing app typography and spacing via ALF atoms
15. **Error states** — network errors, backend unreachable, persona loading failures
16. **Responsive layout** — verify mobile-width rendering in browser (phone-like viewport)

**Test review:** Full test suite audit. Check coverage gaps across all phases. Verify no hardcoded strings escaped Lingui. Run `pnpm test` end-to-end — everything green before moving to device.

**Exit criterion:** feature-complete, visually consistent, no hardcoded English strings outside Lingui.

## Phase 6: On-Device Testing

17. **iOS build + test** — build with Expo, install on physical iPhone, verify all screens and interactions
18. **Android build + test** — build with Expo, install on physical Android device or emulator, verify parity
19. **Platform-specific issues** — fix any RN component differences, safe area insets, keyboard avoidance, SSE polyfill behavior, gesture conflicts

**Exit criterion:** both platforms functional, no web-only assumptions leaking through.

---

## File Map (planned)

```
src/
  lib/api/
    bsky-stats.ts          # fetch wrapper for our backend
    bsky-stats-sse.ts      # SSE client for live stats
    __tests__/
      bsky-stats.test.ts   # unit tests
  state/queries/
    bsky-stats.ts           # TanStack Query hooks
  screens/BskyStats/
    index.tsx               # stats dashboard
    PersonaChat.tsx         # chat conversation screen
    PersonaChatList.tsx     # chat inbox / list screen
    components/             # shared sub-components (sparkline, stat card, etc.)
  view/com/profile/
    ProfileMenu.tsx         # (modify) add "Chat with AI" item
```

## Dev Workflow

- `fnm use 24.15.0` before running anything
- `pnpm web` → iterate in browser at localhost:19006
- `pnpm test` → run Jest unit tests
- `pnpm intl:extract` → after adding Lingui strings
- Each phase gets its own branch + PR
