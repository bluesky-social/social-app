export interface Record {
    subject: Subject;
    createdAt: string;
    [k: string]: unknown;
}
export interface Subject {
    uri: string;
    cid: string;
    [k: string]: unknown;
}
