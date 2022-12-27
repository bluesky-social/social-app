import React from 'react'
import {Profile} from '../../../src/view/screens/Profile'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'
// import {mockedProfileUiStore} from '../../../__mocks__/state-mock'

describe('Profile', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      user: 'test.user',
    },
    visible: true,
  }

  // beforeEach(() => {
  //   jest.mock('react', () => ({
  //     ...jest.requireActual('react'),
  //     useMemo: jest.fn().mockImplementation(() => mockedProfileUiStore),
  //   }))
  // })

  // afterEach(() => {
  //   jest.clearAllMocks()
  // })

  it('renders profile screen', async () => {
    const {findByTestId} = render(<Profile {...mockedProps} />)
    const profileView = await findByTestId('profileView')

    expect(profileView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('test name')
  })

  // TODO:
  // Mock UIState and test Profile screen properly
  // Issues with mocking useMemo implementation
  // Must find another solution to inject mocked state onto Profile component

  // it('mocks profile uiState', async () => {
  //   // testID = emptyProfileView
  // })

  it('matches snapshot', () => {
    const tree = renderer.create(<Profile {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
