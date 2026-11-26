import {render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {FeaturedPublications} from '../FeaturedPublications'

const mockCard = jest.fn<
  null,
  [
    {
      view: app.bsky.embed.external.ViewArticlePublication
      onPressCallback?: (source: 'card' | 'cta') => void
    },
  ]
>(() => null)
const mockLogPress = jest.fn()

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/alf', () => ({atoms: new Proxy({}, {get: () => ({})})}))
jest.mock('#/screens/Atmosphere/metrics/context', () => ({
  AtmosphereContentItem: ({children}: {children: React.ReactNode}) => children,
  useLogContentPress: () => mockLogPress,
}))
jest.mock('#/components/atmosphere/SiteStandard/Publication', () => ({
  PublicationCard: (props: Parameters<typeof mockCard>[0]) => mockCard(props),
}))
jest.mock('../ExploreSectionHeader', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ExploreSectionHeader: ({title}: {title: string}) => <Text>{title}</Text>,
  }
})

const publication: app.bsky.embed.external.ViewArticlePublication = {
  uri: 'https://example.com/pub',
  title: 'Test publication',
  description: 'A description',
}

it('hands each card its original view and logs presses', () => {
  render(<FeaturedPublications publications={[publication]} />)

  expect(screen.getByText('Featured publications')).toBeTruthy()
  const props = mockCard.mock.calls[0][0]
  expect(props.view).toBe(publication)
  props.onPressCallback?.('card')
  expect(mockLogPress).toHaveBeenCalledWith('external', 'card')
})

it('renders nothing without publications', () => {
  render(<FeaturedPublications publications={[]} />)

  expect(screen.queryByText('Featured publications')).toBeNull()
})
