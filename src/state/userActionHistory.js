import React from 'react';
var LIKE_WINDOW = 100;
var FOLLOW_WINDOW = 100;
var FOLLOW_SUGGESTION_WINDOW = 100;
var SEEN_WINDOW = 100;
var userActionHistory = {
    likes: [],
    follows: [],
    followSuggestions: [],
    seen: [],
};
export function getActionHistory() {
    return userActionHistory;
}
export function useActionHistorySnapshot() {
    return React.useState(function () { return getActionHistory(); })[0];
}
export function like(postUris) {
    userActionHistory.likes = userActionHistory.likes
        .concat(postUris)
        .slice(-LIKE_WINDOW);
}
export function unlike(postUris) {
    userActionHistory.likes = userActionHistory.likes.filter(function (uri) { return !postUris.includes(uri); });
}
export function follow(dids) {
    userActionHistory.follows = userActionHistory.follows
        .concat(dids)
        .slice(-FOLLOW_WINDOW);
}
export function followSuggestion(dids) {
    userActionHistory.followSuggestions = userActionHistory.followSuggestions
        .concat(dids)
        .slice(-FOLLOW_SUGGESTION_WINDOW);
}
export function unfollow(dids) {
    userActionHistory.follows = userActionHistory.follows.filter(function (uri) { return !dids.includes(uri); });
}
export function seen(posts) {
    userActionHistory.seen = userActionHistory.seen
        .concat(posts)
        .slice(-SEEN_WINDOW);
}
