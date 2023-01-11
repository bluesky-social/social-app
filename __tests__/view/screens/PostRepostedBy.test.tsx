import React from 'react'
import {PostRepostedBy} from '../../../src/view/screens/PostRepostedBy'
import {cleanup, render} from '../../../jest/test-utils'

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

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders reposted by screen', async () => {
    const {findByTestId} = render(<PostRepostedBy {...mockedProps} />)
    const postRepostedByMainView = await findByTestId('postRepostedByMainView')

    expect(postRepostedByMainView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Reposted by')
  })

  it('matches snapshot', () => {
    const page = render(<PostRepostedBy {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
