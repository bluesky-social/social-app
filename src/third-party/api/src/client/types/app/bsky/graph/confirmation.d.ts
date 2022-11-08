export interface Record {
    originator: {
        did: string;
        declarationCid: string;
        [k: string]: unknown;
    };
    assertion: {
        uri: string;
        cid: string;
        [k: string]: unknown;
    };
    createdAt: string;
    [k: string]: unknown;
}
