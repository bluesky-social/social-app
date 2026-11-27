import {getReportedSubjectStatusLabels} from './reportedSubjectStatus'

describe('report subject status labels', () => {
  it('shows overlapping account and content states independently', () => {
    const labels = getReportedSubjectStatusLabels({
      accountStatus: {enforcement: 'suspended', hosting: 'deleted'},
      subjectStatus: {takendown: true, deleted: true},
    })
    expect(labels.map(label => label.message)).toEqual([
      'Account suspended',
      'Account deleted',
      'Content taken down by moderation',
      'Content deleted',
    ])
  })

  it('shows hosting enforcement when local enforcement is absent', () => {
    expect(
      getReportedSubjectStatusLabels({
        accountStatus: {enforcement: 'none', hosting: 'takendown'},
      }).map(label => label.message),
    ).toEqual(['Account taken down'])
    expect(
      getReportedSubjectStatusLabels({
        accountStatus: {enforcement: 'suspended', hosting: 'takendown'},
      }).map(label => label.message),
    ).toEqual(['Account taken down', 'Account suspended'])
  })

  it('does not infer a status from missing, unknown, or active values', () => {
    expect(getReportedSubjectStatusLabels({})).toEqual([])
    expect(
      getReportedSubjectStatusLabels({
        accountStatus: {enforcement: 'none', hosting: 'active'},
        subjectStatus: {takendown: false},
      }),
    ).toEqual([])
  })
})
