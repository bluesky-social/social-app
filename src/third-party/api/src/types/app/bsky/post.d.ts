export declare type TextSlice = [number, number];
export declare type Entity = {
    index: TextSlice;
    type: string;
    value: string;
    [k: string]: unknown;
}[];
export interface Record {
    text: string;
    entities?: Entity;
    reply?: {
        root: string;
        parent?: string;
        [k: string]: unknown;
    };
    createdAt: string;
    [k: string]: unknown;
}
