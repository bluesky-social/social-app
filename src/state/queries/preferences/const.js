import { DEFAULT_LOGGED_OUT_LABEL_PREFERENCES } from '#/state/queries/preferences/moderation';
export var DEFAULT_HOME_FEED_PREFS = {
    hideReplies: false,
    hideRepliesByUnfollowed: true, // Legacy, ignored
    hideRepliesByLikeCount: 0, // Legacy, ignored
    hideReposts: false,
    hideQuotePosts: false,
    lab_mergeFeedEnabled: false, // experimental
};
export var DEFAULT_THREAD_VIEW_PREFS = {
    sort: 'hotness',
    lab_treeViewEnabled: false,
};
export var DEFAULT_LOGGED_OUT_PREFERENCES = {
    birthDate: new Date('2022-11-17'), // TODO(pwi)
    moderationPrefs: {
        adultContentEnabled: false,
        labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
        labelers: [],
        mutedWords: [],
        hiddenPosts: [],
    },
    feedViewPrefs: DEFAULT_HOME_FEED_PREFS,
    threadViewPrefs: DEFAULT_THREAD_VIEW_PREFS,
    userAge: 13, // TODO(pwi)
    interests: { tags: [] },
    savedFeeds: [],
    bskyAppState: {
        queuedNudges: [],
        activeProgressGuide: undefined,
        nuxs: [],
    },
    postInteractionSettings: {
        threadgateAllowRules: undefined,
        postgateEmbeddingRules: [],
    },
    verificationPrefs: {
        hideBadges: false,
    },
    liveEventPreferences: {
        hideAllFeeds: false,
        hiddenFeedIds: [],
    },
};
