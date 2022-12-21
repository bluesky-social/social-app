import * as AppBskyFeedPost from './post';
import * as AppBskyActorRef from '../actor/ref';
export interface Main {
    post: AppBskyFeedPost.View;
    reply?: ReplyRef;
    reason?: ReasonTrend | ReasonRepost | {
        $type: string;
        [k: string]: unknown;
    };
    [k: string]: unknown;
}
export interface ReplyRef {
    root: AppBskyFeedPost.View;
    parent: AppBskyFeedPost.View;
    [k: string]: unknown;
}
export interface ReasonTrend {
    by: AppBskyActorRef.WithInfo;
    indexedAt: string;
    [k: string]: unknown;
}
export interface ReasonRepost {
    by: AppBskyActorRef.WithInfo;
    indexedAt: string;
    [k: string]: unknown;
}
