import {DEFAULT_SERVICE} from './../../src/state/index'
import {setupState} from '../../src/state'
import {sessionClient} from '@atproto/api'
import {act} from 'react-test-renderer'

describe('rootStore', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  it('tests setupState method', async () => {
    const spyOnApiService = jest.spyOn(sessionClient, 'service')

    act(() => {
      setupState()
    })
    expect(spyOnApiService).toHaveBeenCalledWith(DEFAULT_SERVICE)
  })
})
