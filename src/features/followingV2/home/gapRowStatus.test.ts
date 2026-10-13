import {gapRowStatusAfterFill} from './gapRowStatus'

describe('gapRowStatusAfterFill', () => {
  it.each([
    // The rows may not have caught up with the write yet.
    ['filled', 'filling'],
    ['failed', 'failed'],
    ['superseded', 'idle'],
  ] as const)('shows a row whose fill was %s as %s', (outcome, status) => {
    expect(gapRowStatusAfterFill(outcome)).toBe(status)
  })
})
