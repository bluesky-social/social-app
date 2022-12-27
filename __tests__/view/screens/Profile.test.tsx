import React from 'react'
import {Profile} from '../../../src/view/screens/Profile'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('Profile', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      user: 'test.user',
    },
    visible: true,
  }

  it('renders profile screen', async () => {
    const {findByTestId} = render(<Profile {...mockedProps} />)
    const profileView = await findByTestId('profileView')

    expect(profileView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('test name')
  })

  it("does not render header if it doesn't have state", () => {
    // const {findByTestId} = render(<Profile {...mockedProps} />)
    // mock uiState
    // testID = emptyProfileView
  })

  it('matches snapshot', () => {
    const tree = renderer.create(<Profile {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
