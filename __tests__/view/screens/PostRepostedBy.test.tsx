import React from 'react'
import {PostRepostedBy} from '../../../src/view/screens/PostRepostedBy'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('PostRepostedBy', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      rkey: '123123123',
    },
    visible: true,
  }

  it('renders reposted by screen', async () => {
    const {findByTestId} = render(<PostRepostedBy {...mockedProps} />)
    const postRepostedByView = await findByTestId('postRepostedByView')

    expect(postRepostedByView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Reposted by')
  })

  it('matches snapshot', () => {
    const tree = renderer.create(<PostRepostedBy {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
