import * as AppBskyActorRef from '../actor/ref';
export interface Main {
    items?: (Media | Record | External | {
        $type: string;
        [k: string]: unknown;
    })[];
    [k: string]: unknown;
}
export interface Media {
    alt?: string;
    thumb?: {
        cid: string;
        mimeType: string;
        [k: string]: unknown;
    };
    original: {
        cid: string;
        mimeType: string;
        [k: string]: unknown;
    };
    [k: string]: unknown;
}
export interface Record {
    type: 'record';
    author: AppBskyActorRef.WithInfo;
    record: {};
    [k: string]: unknown;
}
export interface External {
    type: 'external';
    uri: string;
    title: string;
    description: string;
    imageUri: string;
    [k: string]: unknown;
}
