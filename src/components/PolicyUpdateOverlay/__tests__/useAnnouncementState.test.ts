import {describe, test} from '@jest/globals'

import {
  computeCompletedState,
  syncCompletedState,
} from '#/components/PolicyUpdateOverlay/usePolicyUpdateState'

jest.mock('../../../state/queries/nuxs')

describe('computeCompletedState', () => {
  test(`initial state`, () => {
    const completed = computeCompletedState({
      nuxIsReady: false,
      nuxIsCompleted: false,
      nuxIsOptimisticallyCompleted: false,
      completedForDevice: undefined,
    })

    expect(completed).toBe(true)
  })

  test(`nux loaded state`, () => {
    const completed = computeCompletedState({
      nuxIsReady: true,
      nuxIsCompleted: false,
      nuxIsOptimisticallyCompleted: false,
      completedForDevice: undefined,
    })

    expect(completed).toBe(false)
  })

  test(`nux saving state`, () => {
    const completed = computeCompletedState({
      nuxIsReady: true,
      nuxIsCompleted: false,
      nuxIsOptimisticallyCompleted: true,
      completedForDevice: undefined,
    })

    expect(completed).toBe(true)
  })

  test(`nux is completed`, () => {
    const completed = computeCompletedState({
      nuxIsReady: true,
      nuxIsCompleted: true,
      nuxIsOptimisticallyCompleted: false,
      completedForDevice: undefined,
    })

    expect(completed).toBe(true)
  })

  test(`initial state, but already completed for device`, () => {
    const completed = computeCompletedState({
      nuxIsReady: false,
      nuxIsCompleted: false,
      nuxIsOptimisticallyCompleted: false,
      completedForDevice: true,
    })

    expect(completed).toBe(true)
  })
})

describe('syncCompletedState', () => {
  describe('!nuxIsReady', () => {
    test(`!completedForDevice, no-op`, () => {
      const save = jest.fn()
      const setCompletedForDevice = jest.fn()
      syncCompletedState({
        nuxIsReady: false,
        nuxIsCompleted: false,
        nuxIsOptimisticallyCompleted: false,
        completedForDevice: false,
        save,
        setCompletedForDevice,
      })

      expect(save).not.toHaveBeenCalled()
      expect(setCompletedForDevice).not.toHaveBeenCalled()
    })

    test(`completedForDevice, no-op`, () => {
      const save = jest.fn()
      const setCompletedForDevice = jest.fn()
      syncCompletedState({
        nuxIsReady: false,
        nuxIsCompleted: false,
        nuxIsOptimisticallyCompleted: false,
        completedForDevice: true,
        save,
        setCompletedForDevice,
      })

      expect(save).not.toHaveBeenCalled()
      expect(setCompletedForDevice).not.toHaveBeenCalled()
    })
  })

  describe('nuxIsReady', () => {
    describe(`!nuxIsCompleted`, () => {
      describe(`!nuxIsOptimisticallyCompleted`, () => {
        test(`!completedForDevice, no-op`, () => {
          const save = jest.fn()
          const setCompletedForDevice = jest.fn()
          syncCompletedState({
            nuxIsReady: true,
            nuxIsCompleted: false,
            nuxIsOptimisticallyCompleted: false,
            completedForDevice: false,
            save,
            setCompletedForDevice,
          })

          expect(save).not.toHaveBeenCalled()
          expect(setCompletedForDevice).not.toHaveBeenCalled()
        })

        test(`completedForDevice, syncs to server`, () => {
          const save = jest.fn()
          const setCompletedForDevice = jest.fn()
          syncCompletedState({
            nuxIsReady: true,
            nuxIsCompleted: false,
            nuxIsOptimisticallyCompleted: false,
            completedForDevice: true,
            save,
            setCompletedForDevice,
          })

          expect(save).toHaveBeenCalled()
          expect(setCompletedForDevice).not.toHaveBeenCalled()
        })
      })

      /**
       * Catches the case where we already called `save` to sync device state
       * to server, thus `nuxIsOptimisticallyCompleted` is true.
       */
      describe(`nuxIsOptimisticallyCompleted`, () => {
        test(`completedForDevice, no-op`, () => {
          const save = jest.fn()
          const setCompletedForDevice = jest.fn()
          syncCompletedState({
            nuxIsReady: true,
            nuxIsCompleted: false,
            nuxIsOptimisticallyCompleted: true,
            completedForDevice: true,
            save,
            setCompletedForDevice,
          })

          expect(save).not.toHaveBeenCalled()
          expect(setCompletedForDevice).not.toHaveBeenCalled()
        })
      })
    })

    describe(`nuxIsCompleted`, () => {
      test(`!completedForDevice, syncs to device`, () => {
        const save = jest.fn()
        const setCompletedForDevice = jest.fn()
        syncCompletedState({
          nuxIsReady: true,
          nuxIsCompleted: true,
          nuxIsOptimisticallyCompleted: false,
          completedForDevice: false,
          save,
          setCompletedForDevice,
        })

        expect(save).not.toHaveBeenCalled()
        expect(setCompletedForDevice).toHaveBeenCalled()
      })

      test(`completedForDevice, no-op`, () => {
        const save = jest.fn()
        const setCompletedForDevice = jest.fn()
        syncCompletedState({
          nuxIsReady: true,
          nuxIsCompleted: true,
          nuxIsOptimisticallyCompleted: false,
          completedForDevice: true,
          save,
          setCompletedForDevice,
        })

        expect(save).not.toHaveBeenCalled()
        expect(setCompletedForDevice).not.toHaveBeenCalled()
      })
    })
  })
})
