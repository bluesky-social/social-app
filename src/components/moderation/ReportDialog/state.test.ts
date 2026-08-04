import {type app, tools} from '#/lexicons'
import {
  getNciiQualificationOutcome,
  initialState,
  reducer,
  type ReportState,
} from './state'

const nciiOption = {
  title: 'Non-consensual intimate imagery',
  reason: tools.ozone.report.defs.reasonSexualNCII.value,
}

const otherOption = {
  title: 'Unlabeled adult content',
  reason: tools.ozone.report.defs.reasonSexualUnlabeled.value,
}

function selectNciiOption(state: ReportState = initialState) {
  return reducer(state, {type: 'selectOption', option: nciiOption})
}

describe('getNciiQualificationOutcome', () => {
  it('returns undefined when not an NCII report', () => {
    expect(getNciiQualificationOutcome(undefined)).toBeUndefined()
  })

  it('is pending until the question is answered', () => {
    expect(getNciiQualificationOutcome({})).toBe('pending')
  })

  it('directs the depicted person to the external form', () => {
    expect(getNciiQualificationOutcome({isDepicted: true})).toBe('externalForm')
  })

  it('directs everyone else to in-app submission', () => {
    expect(getNciiQualificationOutcome({isDepicted: false})).toBe('inApp')
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

  it('holds at step 2 for the depicted person (external form)', () => {
    let state = selectNciiOption()
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'isDepicted',
      answer: true,
    })
    expect(getNciiQualificationOutcome(state.ncii)).toBe('externalForm')
    expect(state.activeStepIndex1).toBe(2)
  })

  it('advances to step 3 when not the depicted person', () => {
    let state = selectNciiOption()
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'isDepicted',
      answer: false,
    })
    expect(state.activeStepIndex1).toBe(3)
  })

  it('does not advance past a pending question when a labeler is auto-selected', () => {
    let state = selectNciiOption()
    state = reducer(state, {
      type: 'selectLabeler',
      labeler: {} as app.bsky.labeler.defs.LabelerViewDetailed,
    })
    expect(state.activeStepIndex1).toBe(2)
  })

  it('skips to step 4 when the answer resolves after labeler auto-selection', () => {
    let state = selectNciiOption()
    state = reducer(state, {
      type: 'selectLabeler',
      labeler: {} as app.bsky.labeler.defs.LabelerViewDetailed,
    })
    state = reducer(state, {
      type: 'answerNciiQuestion',
      question: 'isDepicted',
      answer: false,
    })
    expect(state.activeStepIndex1).toBe(4)
  })

  it('clears NCII state when the reason or category is cleared', () => {
    const state = selectNciiOption()
    expect(reducer(state, {type: 'clearOption'}).ncii).toBeUndefined()
    expect(reducer(state, {type: 'clearCategory'}).ncii).toBeUndefined()
  })
})

describe('reducer video timestamp', () => {
  const labeler = {} as app.bsky.labeler.defs.LabelerViewDetailed
  const opted: ReportState = {...initialState, includeVideoTimestamp: true}

  it('is off by default', () => {
    expect(initialState.includeVideoTimestamp).toBe(false)
  })

  it('toggles on and back off', () => {
    let state = reducer(initialState, {
      type: 'setIncludeVideoTimestamp',
      include: true,
    })
    expect(state.includeVideoTimestamp).toBe(true)
    state = reducer(state, {type: 'setIncludeVideoTimestamp', include: false})
    expect(state.includeVideoTimestamp).toBe(false)
  })

  it('clears when the moderation service is cleared', () => {
    expect(reducer(opted, {type: 'clearLabeler'}).includeVideoTimestamp).toBe(
      false,
    )
  })

  it('clears when a moderation service is selected', () => {
    expect(
      reducer(opted, {type: 'selectLabeler', labeler}).includeVideoTimestamp,
    ).toBe(false)
  })

  it('clears when the reason or category is cleared', () => {
    expect(reducer(opted, {type: 'clearOption'}).includeVideoTimestamp).toBe(
      false,
    )
    expect(reducer(opted, {type: 'clearCategory'}).includeVideoTimestamp).toBe(
      false,
    )
  })
})
