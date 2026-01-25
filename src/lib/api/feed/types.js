export function isReasonFeedSource(v) {
    return (!!v &&
        typeof v === 'object' &&
        '$type' in v &&
        v.$type === 'reasonFeedSource');
}
