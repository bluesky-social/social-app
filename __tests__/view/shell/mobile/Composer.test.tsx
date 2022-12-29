import React from 'react'
import {Composer} from '../../../../src/view/shell/mobile/Composer'
import {render} from '../../../../jest/test-utils'

describe('Composer', () => {
  jest.useFakeTimers()
  const mockedProps = {
    active: true,
    winHeight: 844,
    replyTo: {
      author: {avatar: undefined, displayName: 'Alice', handle: 'alice.test'},
      cid: 'bafyreieucrv36ylxrut4dr4jj264q2jj2vt2vfvhjfchgw3vua4gksvzia',
      text: 'Captain, maybe we ought to turn on the searchlights now. No… that’s just what they’ll be expecting us to do.',
      uri: 'at://did:plc:v3xz273ea2dzjpu2szsjzfue/app.bsky.feed.post/3jkcir3fhqv2u',
    },
    onPost: jest.fn(),
    onClose: jest.fn(),
  }

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('renders', () => {
    render(<Composer {...mockedProps} />)
  })

  it('matches snapshot', () => {
    const page = render(<Composer {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
