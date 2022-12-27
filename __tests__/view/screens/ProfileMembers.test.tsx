import React from 'react'
import {ProfileMembers} from '../../../src/view/screens/ProfileMembers'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('ProfileMembers', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
    },
    visible: true,
  }

  it('renders members screen', async () => {
    const {findByTestId} = render(<ProfileMembers {...mockedProps} />)
    const profileMembersView = await findByTestId('profileMembersView')

    expect(profileMembersView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Members')
  })

  it('matches snapshot', () => {
    const tree = renderer.create(<ProfileMembers {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
