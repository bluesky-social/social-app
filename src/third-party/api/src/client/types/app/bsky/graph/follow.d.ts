export interface Record {
    subject: {
        did: string;
        declarationCid: string;
        [k: string]: unknown;
    };
    createdAt: string;
    [k: string]: unknown;
}
