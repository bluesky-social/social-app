import {moderationPushDestination, parseModerationPush} from '../moderation'

const base = {
  reason: 'moderation-inbox',
  version: '1',
  recipientDid: 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb',
  serviceDid: 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa',
}

describe('moderation push routing', () => {
  it('routes reports by report ID', () => {
    const payload = parseModerationPush({
      ...base,
      section: 'reports',
      reportId: '42',
    })
    expect(payload && moderationPushDestination(payload)).toEqual({
      name: 'ModerationInboxReportDetails',
      params: {moderationService: base.serviceDid, id: '42'},
    })
  })

  it('routes a subject belonging to the recipient', () => {
    const subject = `at://${base.recipientDid}/app.bsky.feed.post/3abc`
    const payload = parseModerationPush({...base, section: 'subjects', subject})
    expect(payload && moderationPushDestination(payload)).toEqual({
      name: 'ModerationInboxNoticeDetails',
      params: {moderationService: base.serviceDid, subject},
    })
  })

  it('routes standing changes to the account tab', () => {
    const payload = parseModerationPush({...base, section: 'accountStatus'})
    expect(payload && moderationPushDestination(payload)).toEqual({
      name: 'ModerationInbox',
      params: {tab: 'account'},
    })
  })

  it('rejects malformed or foreign targets', () => {
    expect(
      parseModerationPush({...base, version: '2', section: 'accountStatus'}),
    ).toBeNull()
    expect(
      parseModerationPush({...base, section: 'reports', reportId: '0'}),
    ).toBeNull()
    expect(
      parseModerationPush({...base, section: 'reports', reportId: '1/other'}),
    ).toBeNull()
    expect(
      parseModerationPush({
        ...base,
        section: 'subjects',
        subject: 'did:plc:cccccccccccccccccccccccc',
      }),
    ).toBeNull()
    expect(
      parseModerationPush({
        ...base,
        section: 'subjects',
        subject:
          'at://did:plc:cccccccccccccccccccccccc/app.bsky.feed.post/3abc',
      }),
    ).toBeNull()
    expect(
      parseModerationPush({
        ...base,
        serviceDid: 'https://example.com',
        section: 'accountStatus',
      }),
    ).toBeNull()
  })
})
