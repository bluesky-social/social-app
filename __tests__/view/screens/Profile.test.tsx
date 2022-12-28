import React from 'react'
import {Profile} from '../../../src/view/screens/Profile'
import renderer from 'react-test-renderer'
// import {render} from '../../../jest/test-utils'
import {mockedProfileUiStore} from '../../../__mocks__/state-mock'
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

  beforeEach(() => {
    // TODO:
    // Mock UIState and test Profile screen properly
    jest.spyOn(React, 'useMemo').mockReturnValue(mockedProfileUiStore)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // it('renders profile screen', async () => {
  //   const {findByTestId} = render(<Profile {...mockedProps} />)
  //   const profileView = await findByTestId('profileView')

  //   expect(profileView).toBeTruthy()

  //   const headerTitle = await findByTestId('headerTitle')
  //   expect(headerTitle.props.children).toBe('test name')
  // })

  // it('mocks profile uiState', async () => {
  //   // testID = emptyProfileView
  // })

  it('matches snapshot', () => {
    // const tree = renderer.create(<Profile {...mockedProps} />).toJSON()
    // expect(tree).toMatchSnapshot()
  })
})
