import {
  accountReportSubject,
  chatReportSubject,
  recordReportSubject,
} from '#/components/moderation/ReportDialog/utils/reportSubject'

/*
 * These tests pin the wire shape of report subjects. The builders exist only
 * to brand plain strings into the generated `createReport` union; the runtime
 * object must stay byte-identical to the inline literals the consumers used
 * before the migration. Each expected object is hand-written (not derived from
 * the builder) so a shape change fails the test.
 */
describe('reportSubject builders', () => {
  it('accountReportSubject produces a repoRef', () => {
    expect(accountReportSubject('did:plc:abc123')).toEqual({
      $type: 'com.atproto.admin.defs#repoRef',
      did: 'did:plc:abc123',
    })
  })

  it('recordReportSubject produces a strongRef', () => {
    expect(
      recordReportSubject(
        'at://did:plc:abc123/app.bsky.feed.post/xyz',
        'bafyreiexamplecid',
      ),
    ).toEqual({
      $type: 'com.atproto.repo.strongRef',
      uri: 'at://did:plc:abc123/app.bsky.feed.post/xyz',
      cid: 'bafyreiexamplecid',
    })
  })

  it('chatReportSubject preserves a messageRef verbatim', () => {
    expect(
      chatReportSubject({
        $type: 'chat.bsky.convo.defs#messageRef',
        messageId: 'msg-1',
        convoId: 'convo-1',
        did: 'did:plc:sender',
      }),
    ).toEqual({
      $type: 'chat.bsky.convo.defs#messageRef',
      messageId: 'msg-1',
      convoId: 'convo-1',
      did: 'did:plc:sender',
    })
  })

  it('chatReportSubject preserves a convoRef verbatim', () => {
    expect(
      chatReportSubject({
        $type: 'chat.bsky.convo.defs#convoRef',
        convoId: 'convo-1',
        did: 'did:plc:owner',
      }),
    ).toEqual({
      $type: 'chat.bsky.convo.defs#convoRef',
      convoId: 'convo-1',
      did: 'did:plc:owner',
    })
  })
})
