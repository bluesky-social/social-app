export interface Main {
    external: External;
    [k: string]: unknown;
}
export interface External {
    uri: string;
    title: string;
    description: string;
    thumb?: {
        cid: string;
        mimeType: string;
        [k: string]: unknown;
    };
    [k: string]: unknown;
}
export interface Presented {
    external: PresentedExternal;
    [k: string]: unknown;
}
export interface PresentedExternal {
    uri: string;
    title: string;
    description: string;
    thumb?: string;
    [k: string]: unknown;
}
