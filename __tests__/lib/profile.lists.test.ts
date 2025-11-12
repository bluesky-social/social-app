import {
  moderateUserList,
  type ModerationOpts,
  type ModerationPrefs,
} from '@atproto/api'

jest.mock('@atproto/api', () => ({
  moderateUserList: jest.fn(),
}))

describe('profile-lists filtering logic', () => {
  const mockPage = {
    lists: [
      {
        id: 'list1',
        name: 'List 1',
        uri: 'uri1',
        cid: 'cid1',
        creator: 'creator1',
        purpose: 'purpose1',
        indexedAt: new Date().toISOString(),
      },
    ],
  }

  const moderationPrefs: ModerationPrefs = {
    adultContentEnabled: false,
    labels: {},
    labelers: [],
    mutedWords: [],
    hiddenPosts: [],
  }

  const moderationOpts: ModerationOpts = {
    userDid: 'did:example',
    prefs: moderationPrefs,
    labelDefs: {},
  }
  it('includes lists when decision.causes[0].type === "muted"', () => {
    ;(moderateUserList as jest.Mock).mockReturnValueOnce({
      causes: [{type: 'muted'}],
      ui: jest.fn(() => ({filter: false})),
    })

    const filteredPage = {
      ...mockPage,
      lists: mockPage.lists.filter(list => {
        const decision = moderateUserList(list, moderationOpts)
        if (
          decision.causes.length === 1 &&
          decision.causes[0].type === 'muted'
        ) {
          return true
        }
        return !decision.ui('contentList').filter
      }),
    }
    expect(filteredPage.lists).toHaveLength(1)
  })

  it('excludes lists when decision.causes[0].type === "blocked"', () => {
    ;(moderateUserList as jest.Mock).mockReturnValueOnce({
      causes: [{type: 'blocked'}],
      ui: jest.fn(() => ({filter: true})),
    })
    const filteredPage = {
      ...mockPage,
      lists: mockPage.lists.filter(list => {
        const decision = moderateUserList(list, moderationOpts)
        if (
          decision.causes.length === 1 &&
          decision.causes[0].type === 'muted'
        ) {
          return true
        }
        return !decision.ui('contentList').filter
      }),
    }

    expect(filteredPage.lists).toHaveLength(0)
  })
})
