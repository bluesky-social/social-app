export interface Record {
    group: string;
    subject: {
        did: string;
        declarationCid: string;
        [k: string]: unknown;
    };
    createdAt: string;
    [k: string]: unknown;
}
