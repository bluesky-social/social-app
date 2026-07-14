import {
  type AppBskyLabelerDefs,
  ToolsOzoneReportDefs as OzoneReportDefs,
} from '@atproto/api'

import {
  getNciiQualificationOutcome,
  initialState,
  reducer,
  type ReportState,
} from './state'

const nciiOption = {
  title: 'Non-consensual intimate imagery',
  reason: OzoneReportDefs.REASONSEXUALNCII,
}

const otherOption = {
  title: 'Unlabeled adult content',
  reason: OzoneReportDefs.REASONSEXUALUNLABELED,
}

function selectNciiOption(state: ReportState = initialState) {
  return reducer(state, {type: 'selectOption', option: nciiOption})
}

describe('getNciiQualificationOutcome', () => {
  it('returns undefined when not an NCII report', () => {
    expect(getNciiQualificationOutcome(undefined)).toBeUndefined()
  })

  it('is pending until questions are answered', () => {
    expect(getNciiQualificationOutcome({})).toBe('pending')
    expect(getNciiQualificationOutcome({residesInUS: true})).toBe('pending')
  })

  it('directs US residents depicted in the imagery to the external form', () => {
    expect(
      getNciiQualificationOutcome({residesInUS: true, isDepicted: true}),
    ).toBe('externalForm')
  })

  it('directs everyone else to in-app submission', () => {
    expect(getNciiQualificationOutcome({residesInUS: false})).toBe('inApp')
    expect(
      getNciiQualificationOutcome({residesInUS: true, isDepicted: false}),
    ).toBe('inApp')
  })
})

describe('reducer NCII qualification', () => {
  it('holds at step 2 when the NCII reason is selected', () => {
    const state = selectNciiOption()
    expect(state.activeStepIndex1).toBe(2)
    expect(state.ncii).toEqual({})
  })

  it('does not gate non-NCII reasons', () => {
    const state = reducer(initialState, {
      type: 'selectOption',
      option: otherOption,
    })
    expect(state.activeStepIndex1).toBe(3)
    expect(state.ncii).toBeUndefined()
  })

  it('advances to step 3 for non-US residents', () => {
    let state = selectNciiOption()
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'residesInUS',
      answer: false,
    })
    expect(state.activeStepIndex1).toBe(3)
  })

  it('holds at step 2 for US residents until the second answer', () => {
    let state = selectNciiOption()
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'residesInUS',
      answer: true,
    })
    expect(state.activeStepIndex1).toBe(2)
  })

  it('holds at step 2 for depicted US residents (external form)', () => {
    let state = selectNciiOption()
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'residesInUS',
      answer: true,
    })
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'isDepicted',
      answer: true,
    })
    expect(getNciiQualificationOutcome(state.ncii)).toBe('externalForm')
    expect(state.activeStepIndex1).toBe(2)
  })

  it('advances to step 3 for non-depicted US residents', () => {
    let state = selectNciiOption()
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'residesInUS',
      answer: true,
    })
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'isDepicted',
      answer: false,
    })
    expect(state.activeStepIndex1).toBe(3)
  })

  it('resets the second answer when the first changes', () => {
    let state = selectNciiOption()
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'residesInUS',
      answer: true,
    })
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'isDepicted',
      answer: true,
    })
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'residesInUS',
      answer: true,
    })
    expect(state.ncii?.isDepicted).toBeUndefined()
    expect(state.activeStepIndex1).toBe(2)
  })

  it('does not advance past pending questions when a labeler is auto-selected', () => {
    let state = selectNciiOption()
    state = reducer(state, {
      type: 'selectLabeler',
      labeler: {} as AppBskyLabelerDefs.LabelerViewDetailed,
    })
    expect(state.activeStepIndex1).toBe(2)
  })

  it('skips to step 4 when answers resolve after labeler auto-selection', () => {
    let state = selectNciiOption()
    state = reducer(state, {
      type: 'selectLabeler',
      labeler: {} as AppBskyLabelerDefs.LabelerViewDetailed,
    })
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'residesInUS',
      answer: false,
    })
    expect(state.activeStepIndex1).toBe(4)
  })

  it('clears NCII state when the reason or category is cleared', () => {
    let state = selectNciiOption()
    expect(reducer(state, {type: 'clearOption'}).ncii).toBeUndefined()
    expect(reducer(state, {type: 'clearCategory'}).ncii).toBeUndefined()
  })
})
