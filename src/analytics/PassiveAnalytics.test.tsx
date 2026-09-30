import {render} from '@testing-library/react-native'

import {onAppStateChange} from '#/lib/appState'
import {PassiveAnalytics} from '#/analytics/PassiveAnalytics'

const mockMetric = jest.fn()
const mockAnalytics = {metric: mockMetric}
const mockRemove = jest.fn()
jest.mock('#/analytics', () => ({useAnalytics: () => mockAnalytics}))
jest.mock('#/lib/appState', () => ({
  onAppStateChange: jest.fn(() => ({remove: mockRemove})),
}))

beforeEach(() => jest.clearAllMocks())

it('reports foreground/background with empty payloads', () => {
  render(<PassiveAnalytics />)
  const listener = jest.mocked(onAppStateChange).mock.calls[0][0]
  listener('active')
  listener('background')
  listener('active')
  listener('inactive')
  expect(mockMetric.mock.calls).toEqual([
    ['state:foreground', {}],
    ['state:background', {}],
    ['state:foreground', {}],
    ['state:background', {}],
  ])
})

it('reports a background transition without needing a prior foreground timer', () => {
  render(<PassiveAnalytics />)
  expect(mockMetric).not.toHaveBeenCalled()
  jest.mocked(onAppStateChange).mock.calls[0][0]('background')
  expect(mockMetric).toHaveBeenCalledWith('state:background', {})
})

it('removes its lifecycle subscription on unmount', () => {
  const view = render(<PassiveAnalytics />)
  view.unmount()
  expect(mockRemove).toHaveBeenCalledTimes(1)
  expect(mockMetric).not.toHaveBeenCalled()
})
