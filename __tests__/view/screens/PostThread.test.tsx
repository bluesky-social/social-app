import React from 'react'
import {PostThread} from '../../../src/view/screens/PostThread'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('PostThread', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      rkey: '123123123',
    },
    visible: true,
  }

  it('renders post screen', async () => {
    const {findByTestId} = render(<PostThread {...mockedProps} />)
    const postThreadView = await findByTestId('postThreadView')

    expect(postThreadView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Post')
  })

  it('matches snapshot', () => {
    const tree = renderer.create(<PostThread {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
