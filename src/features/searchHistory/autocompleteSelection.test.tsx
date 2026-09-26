import {
  Pressable as MockPressable,
  Text as MockText,
  TextInput as MockTextInput,
  View as MockView,
} from 'react-native'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {DesktopSearch} from '#/view/shell/desktop/Search'
import {AutocompleteResults} from '#/screens/Search/components/AutocompleteResults'
// Exercise the web implementation even under the native Jest preset.
import {SearchAutocompleteInput} from '#/screens/Search/components/SearchAutocompleteInput/index.tsx'
import {type AutocompleteItem} from '#/components/Autocomplete/types'

const mockUpdateProfileHistory = jest.fn()
const mockUpdateSearchHistory = jest.fn()
const mockNavigate = jest.fn()
const mockPush = jest.fn()
const mockBlur = jest.fn()
let mockItems: AutocompleteItem[] = []

jest.mock('#/alf', () => ({
  atoms: {p_sm: {padding: 8}},
  native: (value: unknown) => value,
  useTheme: () => ({atoms: {}}),
}))
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => ({}),
}))
jest.mock('#/analytics', () => ({useAnalytics: () => ({metric: jest.fn()})}))
jest.mock('#/components/Layout', () => ({Content: MockView}))
jest.mock('#/components/Typography', () => ({Text: MockText}))
jest.mock('#/components/Loader', () => ({Loader: MockView}))
jest.mock('#/components/Link', () => ({Link: MockView}))
jest.mock('#/screens/Search/components/SearchProfileCard', () => ({
  SearchProfileCard: MockView,
}))
jest.mock('#/features/searchHistory', () => ({
  useSearchHistory: () => ({
    updateProfileHistory: mockUpdateProfileHistory,
    updateSearchHistory: mockUpdateSearchHistory,
  }),
}))
jest.mock('#/features/searchHistory/useRecentSearchesSource', () => ({
  useRecentSearchesSource: () => ({key: 'recents', items: mockItems}),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate, push: mockPush}),
}))
jest.mock('@bsky.app/sift', () => ({
  useSift: () => ({
    refs: {setAnchor: jest.fn()},
    targetProps: {},
    elements: {input: {blur: mockBlur}},
    updatePosition: jest.fn(),
  }),
}))
jest.mock('#/components/forms/SearchInput', () => ({
  SearchInput: (props: React.ComponentProps<typeof MockTextInput>) => (
    <MockTextInput {...props} testID="search-input" />
  ),
}))
jest.mock('#/components/Autocomplete', () => ({
  useAutocomplete: () => ({items: mockItems}),
  Autocomplete: ({
    data,
    onSelect,
  }: {
    data: AutocompleteItem[]
    onSelect: (item: AutocompleteItem) => void
  }) => (
    <>
      {data.map(item => (
        <MockPressable
          key={item.key}
          testID={item.key}
          onPress={() => onSelect(item)}>
          <MockText>{item.value}</MockText>
        </MockPressable>
      ))}
    </>
  ),
}))

beforeEach(() => jest.clearAllMocks())

it('records a desktop profile selection before navigating', () => {
  const profile = {did: 'did:plc:alice' as const, handle: 'alice.test' as const}
  mockItems = [
    {key: profile.did, type: 'profile', value: '@alice.test', profile},
  ]
  const screen = render(<DesktopSearch />)
  fireEvent(screen.getByTestId('search-input'), 'focus')
  fireEvent.press(screen.getByTestId(profile.did))
  expect(mockUpdateProfileHistory).toHaveBeenCalledWith(profile)
  expect(mockNavigate).toHaveBeenCalledWith('Profile', {name: profile.handle})
})

it('records and restores filters when replaying a desktop recent search', () => {
  const filters = {author: 'alice.test'}
  mockItems = [{key: 'recent', type: 'search', value: 'cats', filters}]
  const screen = render(<DesktopSearch />)
  fireEvent(screen.getByTestId('search-input'), 'focus')
  fireEvent.press(screen.getByTestId('recent'))
  expect(mockUpdateSearchHistory).toHaveBeenCalledWith('cats', filters)
  expect(mockPush).toHaveBeenCalledWith('Search', {q: 'cats', ...filters})
})

it('passes recent filters through the main web search dropdown', () => {
  const filters = {author: 'alice.test'}
  mockItems = [{key: 'recent', type: 'search', value: 'cats', filters}]
  const onSelectSearch = jest.fn()
  const screen = render(
    <SearchAutocompleteInput value="cat" onSelectSearch={onSelectSearch} />,
  )
  fireEvent(screen.getByTestId('search-input'), 'focus', {})
  fireEvent.press(screen.getByTestId('recent'))
  expect(onSelectSearch).toHaveBeenCalledWith('cats', filters)
})

it('renders native recent terms and replays their filters', () => {
  const filters = {author: 'alice.test'}
  const onSelectSearch = jest.fn()
  const i18n = setupI18n({locale: 'en', messages: {en: {}}})
  const screen = render(
    <I18nProvider i18n={i18n}>
      <AutocompleteResults
        items={[{key: 'recent', type: 'search', value: 'cats', filters}]}
        isFetching={false}
        searchText="ca"
        onSubmit={jest.fn()}
        onResultPress={jest.fn()}
        onProfileClick={jest.fn()}
        onSelectSearch={onSelectSearch}
      />
    </I18nProvider>,
  )
  fireEvent.press(screen.getByText(/cats/))
  expect(onSelectSearch).toHaveBeenCalledWith('cats', filters)
})
