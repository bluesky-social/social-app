import { useMemo } from 'react';
import { FeedTuner } from '#/lib/api/feed-manip';
import { usePreferencesQuery } from '../queries/preferences';
import { useSession } from '../session';
import { useLanguagePrefs } from './languages';
export function useFeedTuners(feedDesc) {
    var langPrefs = useLanguagePrefs();
    var preferences = usePreferencesQuery().data;
    var currentAccount = useSession().currentAccount;
    return useMemo(function () {
        if (feedDesc.startsWith('author')) {
            if (feedDesc.endsWith('|posts_with_replies')) {
                // TODO: Do this on the server instead.
                return [FeedTuner.removeReposts];
            }
        }
        if (feedDesc.startsWith('feedgen')) {
            return [
                FeedTuner.preferredLangOnly(langPrefs.contentLanguages),
                FeedTuner.removeMutedThreads,
            ];
        }
        if (feedDesc === 'following' || feedDesc.startsWith('list')) {
            var feedTuners = [FeedTuner.removeOrphans];
            if (preferences === null || preferences === void 0 ? void 0 : preferences.feedViewPrefs.hideReposts) {
                feedTuners.push(FeedTuner.removeReposts);
            }
            if (preferences === null || preferences === void 0 ? void 0 : preferences.feedViewPrefs.hideReplies) {
                feedTuners.push(FeedTuner.removeReplies);
            }
            else {
                feedTuners.push(FeedTuner.followedRepliesOnly({
                    userDid: (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) || '',
                }));
            }
            if (preferences === null || preferences === void 0 ? void 0 : preferences.feedViewPrefs.hideQuotePosts) {
                feedTuners.push(FeedTuner.removeQuotePosts);
            }
            feedTuners.push(FeedTuner.dedupThreads);
            feedTuners.push(FeedTuner.removeMutedThreads);
            return feedTuners;
        }
        return [];
    }, [feedDesc, currentAccount, preferences, langPrefs]);
}
