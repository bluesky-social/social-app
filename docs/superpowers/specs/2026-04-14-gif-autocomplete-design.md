# GIF Autocomplete Design

Inline search suggestions in the GIF picker dialog, powered by Klipy's
`/v2/autocomplete` endpoint.

## Context

The GIF picker currently has a search field that fires a full GIF search after a
500ms throttle. There is no typeahead or suggestion behavior — the user types
blindly and waits for results. Klipy exposes an autocomplete endpoint that
returns lightweight string suggestions for a partial query, which we can use to
help users find the right search term faster.

## Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Suggestion placement | Inline list below search input | Avoids Portal/z-index issues inside the dialog. Fits the reserved slot in `GifPickerHeader`. No need for Sift's anchor-relative positioning. |
| Keyboard navigation (web) | Custom lightweight handler (~30 lines) | Sift's positioning model (`position: fixed`) fights inline rendering. Borrowing the keyboard pattern without the positioning baggage. |
| Visibility | Show when 1+ characters typed, hide on selection or clear | No suggestions on empty input — featured GIFs serve that role. |
| Provider scope | Klipy only | Tenor is being sunset. Users on the Tenor path don't get suggestions. |
| Throttle timing | 200ms for autocomplete, independent of 500ms search throttle | Autocomplete responses are tiny (string array). Snappy feel expected for typeahead. |

## Klipy Autocomplete Endpoint

**Request:**
```
GET https://gifs.bsky.app/klipy/v2/autocomplete?q=<query>&client_key=<key>&limit=<n>&locale=<locale>
```

**Response:**
```json
{
  "locale": "en",
  "results": ["happy birthday", "happy", "happy easter", "happy dance"]
}
```

Parameters follow the same pattern as the existing search/featured endpoints
(`client_key`, `locale`). We'll request `limit=8` suggestions — enough to be
useful without overwhelming the list or pushing the GIF grid too far down.

## Architecture

### Component Tree

```
GifPickerDialog
└─ GifPickerBody
   ├─ GifPickerHeader
   │  ├─ TextField.Input (search box)
   │  └─ GifAutocompleteSuggestions  ← NEW
   ├─ GifPickerPlaceholder
   └─ GifPickerGrid
```

### Data Flow

1. User types → `rawSearch` state updates
2. `rawSearch` throttled at **200ms** → fires `useKlipyAutocompleteQuery`
3. `rawSearch` throttled at **500ms** → fires GIF search query (existing)
4. Autocomplete response → string array rendered as suggestion list
5. User taps/selects suggestion → fills input + triggers GIF search
6. Suggestions hide when input matches a selected term

### File Changes

**New files:**

- `src/features/gifPicker/components/GifAutocompleteSuggestions.tsx` — inline
  suggestion list UI. Renders a vertical list of suggestion rows, each with a
  search icon and the suggestion text. Handles `onPress` to select a suggestion.
  On web, tracks `activeIndex` for keyboard highlight state.

- `src/features/gifPicker/hooks/useGifAutocomplete.ts` — orchestration hook.
  Manages the 200ms throttled value, calls `useKlipyAutocompleteQuery`,
  tracks whether suggestions should be visible (based on typing vs. selection),
  and exposes keyboard navigation state for web.

**Modified files:**

- `src/lib/constants.ts` — add `GIF_KLIPY_AUTOCOMPLETE` endpoint constant.

- `src/state/queries/klipy.ts` — add `useKlipyAutocompleteQuery` hook. Uses
  `useQuery` (not infinite — no pagination). Returns `string[]`.

- `src/features/gifPicker/components/GifPickerHeader.tsx` — render
  `GifAutocompleteSuggestions` below the search input. Pass down the
  autocomplete state and selection callback.

- `src/features/gifPicker/GifPickerDialog.tsx` — wire up `useGifAutocomplete`
  hook. Manage the interaction between autocomplete selection and the existing
  search state (selecting a suggestion sets `rawSearch` to the suggestion text).

## Interaction States

### 1. Idle — no suggestions

Search field is empty or unfocused. Featured GIFs show in the grid. No
suggestion list rendered.

### 2. Typing — suggestions appear

User has typed 1+ characters. Suggestion list appears between the search input
and the GIF grid, pushing the grid down. Suggestions update as the user types
(200ms throttle). On web, the first suggestion is highlighted by default.

### 3. Selected — GIFs load

User taps a suggestion (or presses Enter on web). The suggestion text fills the
search input. Suggestions hide. The 500ms search throttle fires with the
selected term and GIF results populate the grid.

### 4. Editing after selection

User modifies the input after a selection (e.g., backspace). Suggestions
re-appear with updated results for the new partial query.

## Keyboard Navigation (Web Only)

Handled via an `onKeyDown` listener on the search `TextInput`:

| Key | Action |
|-----|--------|
| ArrowDown | Move active highlight to next suggestion |
| ArrowUp | Move active highlight to previous suggestion |
| Enter | Select the active suggestion (fill input, fire search) |
| Escape | Dismiss suggestions (then closes dialog on second press) |

### Accessibility

- Search input: `role="combobox"`, `aria-controls="<listbox-id>"`,
  `aria-expanded`, `aria-autocomplete="list"`,
  `aria-activedescendant="<active-item-id>"`
- Suggestion list: `role="listbox"`, `id="<listbox-id>"`
- Each suggestion: `role="option"`, `aria-selected`, `id="<item-id>"`

## Visibility Rules

```
SHOW  when: rawSearch.length >= 1 AND suggestions.length > 0 AND not just selected
HIDE  when: rawSearch is empty OR user selected a suggestion OR user clears input
RE-SHOW when: user edits the input after a selection (e.g., backspace)
```

The "not just selected" flag prevents suggestions from flickering when the
selected term is written into the input (which would otherwise trigger a new
autocomplete query matching the full term).

## Query Hook Design

```ts
// src/state/queries/klipy.ts

export const RQKEY_AUTOCOMPLETE = (query: string) =>
  [RQKEY_ROOT, 'autocomplete', query]

export function useKlipyAutocompleteQuery(
  query: string,
  options?: {enabled?: boolean},
) {
  return useQuery({
    queryKey: RQKEY_AUTOCOMPLETE(query),
    queryFn: () => fetchKlipyAutocomplete(query),
    enabled: query.length > 0 && options?.enabled !== false,
    staleTime: STALE.HOURS.ONE,
  })
}
```

Uses `useQuery` (not `useInfiniteQuery`) since there's no pagination. Results
are cached with a long stale time — autocomplete suggestions for a given prefix
don't change frequently.

The fetch function reuses the same `client_key`/`locale`/`contentfilter`
parameter pattern as the existing `createKlipyApi` helper.

## Scope Boundaries

**In scope:**
- Klipy autocomplete endpoint integration
- Inline suggestion list in GifPickerHeader
- 200ms throttle for autocomplete, independent of 500ms search throttle
- Keyboard navigation on web (arrow keys, enter, escape)
- ARIA accessibility attributes
- Tap-to-select on native

**Out of scope:**
- Tenor autocomplete (Klipy only)
- Trending/popular suggestions on empty input
- Search history / recents
- Categories or tag browsing
