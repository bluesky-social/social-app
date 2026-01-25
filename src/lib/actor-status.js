import { useMemo } from 'react';
import { AppBskyEmbedExternal, } from '@atproto/api';
import { isAfter, parseISO } from 'date-fns';
import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { useLiveNowConfig } from '#/state/service-config';
import { useTickEveryMinute } from '#/state/shell';
export function useActorStatus(actor) {
    var shadowed = useMaybeProfileShadow(actor);
    var tick = useTickEveryMinute();
    var config = useLiveNowConfig();
    return useMemo(function () {
        void tick; // revalidate every minute
        if (shadowed && 'status' in shadowed && shadowed.status) {
            var isValid = validateStatus(shadowed.status, config);
            var isDisabled = shadowed.status.isDisabled || false;
            var isActive = isStatusStillActive(shadowed.status.expiresAt);
            if (isValid && !isDisabled && isActive) {
                return {
                    uri: shadowed.status.uri,
                    cid: shadowed.status.cid,
                    isDisabled: false,
                    isActive: true,
                    status: 'app.bsky.actor.status#live',
                    embed: shadowed.status.embed, // temp_isStatusValid asserts this
                    expiresAt: shadowed.status.expiresAt, // isStatusStillActive asserts this
                    record: shadowed.status.record,
                };
            }
            return {
                uri: shadowed.status.uri,
                cid: shadowed.status.cid,
                isDisabled: isDisabled,
                isActive: false,
                status: 'app.bsky.actor.status#live',
                embed: shadowed.status.embed, // temp_isStatusValid asserts this
                expiresAt: shadowed.status.expiresAt, // isStatusStillActive asserts this
                record: shadowed.status.record,
            };
        }
        else {
            return {
                status: '',
                isDisabled: false,
                isActive: false,
                record: {},
            };
        }
    }, [shadowed, config, tick]);
}
export function isStatusStillActive(timeStr) {
    if (!timeStr)
        return false;
    var now = new Date();
    var expiry = parseISO(timeStr);
    return isAfter(expiry, now);
}
export function validateStatus(status, config) {
    if (status.status !== 'app.bsky.actor.status#live')
        return false;
    try {
        if (AppBskyEmbedExternal.isView(status.embed)) {
            var url = new URL(status.embed.external.uri);
            return config.allowedDomains.has(url.hostname);
        }
        else {
            return false;
        }
    }
    catch (_a) {
        return false;
    }
}
