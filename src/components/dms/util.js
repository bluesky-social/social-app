import { EMOJI_REACTION_LIMIT } from '#/lib/constants';
export function canBeMessaged(profile) {
    var _a, _b, _c;
    switch ((_b = (_a = profile.associated) === null || _a === void 0 ? void 0 : _a.chat) === null || _b === void 0 ? void 0 : _b.allowIncoming) {
        case 'none':
            return false;
        case 'all':
            return true;
        // if unset, treat as following
        case 'following':
        case undefined:
            return Boolean((_c = profile.viewer) === null || _c === void 0 ? void 0 : _c.followedBy);
        // any other values are invalid according to the lexicon, so
        // let's treat as false to be safe
        default:
            return false;
    }
}
export function localDateString(date) {
    // can't use toISOString because it should be in local time
    var mm = date.getMonth();
    var dd = date.getDate();
    var yyyy = date.getFullYear();
    // not padding with 0s because it's not necessary, it's just used for comparison
    return "".concat(yyyy, "-").concat(mm, "-").concat(dd);
}
export function hasAlreadyReacted(message, myDid, emoji) {
    if (!message.reactions) {
        return false;
    }
    return !!message.reactions.find(function (reaction) { return reaction.value === emoji && reaction.sender.did === myDid; });
}
export function hasReachedReactionLimit(message, myDid) {
    if (!message.reactions) {
        return false;
    }
    var myReactions = message.reactions.filter(function (reaction) { return reaction.sender.did === myDid; });
    return myReactions.length >= EMOJI_REACTION_LIMIT;
}
