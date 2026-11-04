import {type tools} from '#/lexicons'
import {getNoticeLabels} from '../noticeLabels'
import {getReportActionLabel} from '../reportActionLabel'

const action = {
  id: 1,
  type: 'communicationSent',
  createdAt: '2026-01-01T00:00:00.000Z',
}

it('uses a neutral communication label on reports', () => {
  expect(
    getReportActionLabel({status: 'resolved', lastActionTaken: action.type})
      ?.message,
  ).toBe('Communication sent')
})

it('uses account-specific wording only for account notices', () => {
  const data = {
    subject: {$type: 'com.atproto.admin.defs#repoRef', did: 'did:plc:owner'},
    actions: [action],
    enforcement: {state: 'takendown'},
  } as unknown as tools.ozone.inbox.getActionedSubject.$OutputBody
  expect(getNoticeLabels(data).header.message).toBe('Email about your account')
  expect(
    getNoticeLabels({
      ...data,
      subject: {
        $type: 'com.atproto.repo.strongRef',
        uri: 'at://did:plc:owner/app.bsky.feed.post/123',
        cid: 'bafkreiatest',
      },
    }).header.message,
  ).toBe('Communication sent')
})
