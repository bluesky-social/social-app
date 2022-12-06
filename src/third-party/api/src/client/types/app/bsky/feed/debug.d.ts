export interface Record {
    text: string;
    entities?: Entity[];
    reply?: Reply;
    createdAt: string;
    [k: string]: unknown;
}
export declare const SOMETOKEN = "app.bsky.feed.debug#someToken";
export declare type Unknown = {};
export declare type Boolean = boolean;
export declare type Number = number;
export declare type Integer = number;
export declare type String = string;
export declare type Blob = {
    cid: string;
    mimeType: string;
    [k: string]: unknown;
};
export declare type Image = {
    cid: string;
    mimeType: string;
    [k: string]: unknown;
};
export declare type Video = {
    cid: string;
    mimeType: string;
    [k: string]: unknown;
};
export declare type Audio = {
    cid: string;
    mimeType: string;
    [k: string]: unknown;
};
export declare type StringArr = string[];
export declare type ReplyArr = Reply[];
export declare type MultiArr = (Reply | PostRef | Entity)[];
export interface Reply {
    root: PostRef;
    parent: PostRef;
    [k: string]: unknown;
}
export interface PostRef {
    uri: string;
    cid: string;
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
