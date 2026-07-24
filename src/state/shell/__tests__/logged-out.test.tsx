import {act, renderHook} from '@testing-library/react-native'

import {
  Provider,
  useLoggedOutView,
  useLoggedOutViewControls,
} from '../logged-out'

jest.mock('#/state/session', () => ({
  useSession: () => ({hasSession: false}),
}))
jest.mock('#/state/shell/landing', () => ({
  useActiveLanding: () => undefined,
}))
jest.mock('#/env', () => ({IS_WEB: false}))

describe('logged-out view controls', () => {
  it('identifies repeated account-switch requests', () => {
    const {result} = renderHook(
      () => ({
        state: useLoggedOutView(),
        controls: useLoggedOutViewControls(),
      }),
      {wrapper: Provider},
    )

    act(() => {
      result.current.controls.requestSwitchToAccount({
        requestedAccount: 'none',
      })
    })

    expect(result.current.state).toMatchObject({
      requestedAccountSwitchTo: 'none',
      requestedAccountSwitchId: 1,
    })

    act(() => {
      result.current.controls.requestSwitchToAccount({
        requestedAccount: 'none',
      })
    })

    expect(result.current.state.requestedAccountSwitchId).toBe(2)
  })
})
