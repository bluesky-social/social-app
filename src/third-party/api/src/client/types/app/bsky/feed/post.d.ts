import * as AppBskyEmbedImages from '../embed/images';
import * as AppBskyEmbedExternal from '../embed/external';
import * as ComAtprotoRepoStrongRef from '../../../com/atproto/repo/strongRef';
import * as AppBskyActorRef from '../actor/ref';
export interface Record {
    text: string;
    entities?: Entity[];
    reply?: ReplyRef;
    embed?: AppBskyEmbedImages.Main | AppBskyEmbedExternal.Main | {
        $type: string;
        [k: string]: unknown;
    };
    createdAt: string;
    [k: string]: unknown;
}
export interface ReplyRef {
    root: ComAtprotoRepoStrongRef.Main;
    parent: ComAtprotoRepoStrongRef.Main;
    [k: string]: unknown;
}
export interface Entity {
    index: TextSlice;
    type: string;
    value: string;
    [k: string]: unknown;
}
export interface TextSlice {
    start: number;
    end: number;
    [k: string]: unknown;
}
export interface View {
    uri: string;
    cid: string;
    author: AppBskyActorRef.WithInfo;
    record: {};
    embed?: AppBskyEmbedImages.Presented | AppBskyEmbedExternal.Presented | {
        $type: string;
        [k: string]: unknown;
    };
    replyCount: number;
    repostCount: number;
    upvoteCount: number;
    downvoteCount: number;
    indexedAt: string;
    viewer: ViewerState;
    [k: string]: unknown;
}
export interface ViewerState {
    repost?: string;
    upvote?: string;
    downvote?: string;
    [k: string]: unknown;
}
