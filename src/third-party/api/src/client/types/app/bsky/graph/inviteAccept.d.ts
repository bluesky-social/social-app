export interface Record {
    group: {
        did: string;
        declarationCid: string;
        [k: string]: unknown;
    };
    invite: {
        uri: string;
        cid: string;
        [k: string]: unknown;
    };
    createdAt: string;
    [k: string]: unknown;
}
