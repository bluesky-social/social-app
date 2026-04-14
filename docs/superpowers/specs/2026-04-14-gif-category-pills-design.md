# GIF Category Pills Design

Horizontal scrollable row of category pills on the GIF picker's idle screen,
letting users browse GIFs by emotion/reaction category.

## Context

The GIF picker currently shows featured/trending GIFs on the idle screen with a
search input above. Users can type to search, but there's no way to browse by
category. Threads shows a row of category pills (Trending, Love, Happy, Sad,
etc.) that give quick access to common GIF reactions without typing.

## Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Layout | Horizontal scrollable pill row + featured grid below | Matches Threads pattern. Pills provide quick access, grid fills remaining space. |
| Categories | Hardcoded curated list of 8 | Predictable, no extra API call, intentional selection of popular emotions. |
| "Trending" pill | Uses existing featured endpoint | No search query needed — it's the default idle view. |
| Category tap behavior | Sets search query to category's searchterm | Reuses existing `useGifPickerData` search path, no new data fetching logic. |
| Pills while typing | Hide when input has text, reappear when cleared | Clean separation between browse and search modes. |

## Curated Categories

| Pill | Search term | Emoji |
|------|------------|-------|
| Trending | *(featured endpoint, no search)* | 🔥 |
| Love | `love` | ❤️ |
| Happy | `happy` | 😄 |
| Sad | `cry` | 😢 |
| Party | `congratulations` | 🎉 |
| Yes | `yes` | 👍 |
| LOL | `lol` | 😂 |
| Excited | `excited` | 🤩 |

"Trending" is the default active pill when the dialog opens.

## Architecture

### Component Tree

```
GifPickerBody
├─ GifPickerHeader
│  └─ TextField.Input
├─ GifCategoryPills          ← NEW (hidden when typing)
├─ GifPickerPlaceholder
└─ GifPickerGrid
```

### Data Flow

1. Dialog opens → "Trending" pill active → featured endpoint fires (existing)
2. User taps a category pill → active pill updates → search query set to
   pill's `searchterm` → `useGifPickerData` fires the search endpoint
3. User starts typing → pills hide → search query comes from text input
4. User clears input → pills reappear → active pill resets to "Trending" →
   featured GIFs reload

### File Changes

**New files:**

- `src/features/gifPicker/components/GifCategoryPills.tsx` — horizontal
  scrollable row of pill buttons. Accepts `activeCategory`, `onSelectCategory`,
  and `visible` props. Each pill is a `Pressable` with emoji + label. The
  active pill gets a highlighted background. The component renders `null` when
  `visible` is false.

**Modified files:**

- `src/features/gifPicker/GifPickerDialog.tsx` — add `activeCategory` state to
  `GifPickerBody`. When a category is selected (and it's not "trending"), pass
  its searchterm as the search query to `useGifPickerData`. Render
  `GifCategoryPills` in the header area. Hide pills when `rawSearch.length > 0`.
  Reset `activeCategory` to "trending" when input is cleared.

## Interaction States

### 1. Idle — "Trending" active

Dialog just opened. "Trending" pill is highlighted. Featured GIFs show in the
grid. Search input is empty.

### 2. Category selected

User tapped a category pill (e.g., "Happy"). That pill highlights, "Trending"
unhighlights. Grid shows search results for "happy". Search input stays empty
— the query comes from the pill, not the text field.

### 3. Typing — pills hidden

User started typing in the search input. The pill row hides entirely. Grid
shows search results for whatever the user typed. The `activeCategory` state
stays as-is (not reset) — it's just not visible or used while typing. This
avoids unnecessary state churn; it only resets when the input is fully cleared.

### 4. Input cleared — pills return

User cleared the search input (backspace or clear button). Pills reappear with
"Trending" active. Featured GIFs reload in the grid.

## Pill Styling

- Horizontal `ScrollView` with `horizontal` and `showsHorizontalScrollIndicator={false}`
- Each pill: `Pressable` with `rounded_full`, emoji + text, theme-aware colors
- Active pill: stronger background (`t.atoms.bg_contrast_100` or similar)
- Inactive pill: subtle border (`t.atoms.border_contrast_low`)
- Row has horizontal padding matching the GIF grid

## Scope Boundaries

**In scope:**
- `GifCategoryPills` component with horizontal scroll
- 8 curated category pills with emoji + label
- Tap pill → search GIFs for that category
- Pills hide when typing, reappear when cleared
- Active pill highlight styling
- "Trending" as default active pill (uses featured endpoint)

**Out of scope:**
- Recent / Favorited pills (needs client-side persistence)
- Dynamic categories from the `/v2/categories` API
- Category GIF thumbnails on the pills
- Animation for pills show/hide transition
