export declare enum ErrorCode {
    NetworkError = "NetworkError",
    DidResolutionFailed = "DidResolutionFailed",
    NameResolutionFailed = "NameResolutionFailed"
}
export declare class NameResolutionFailed extends Error {
    code: ErrorCode;
    constructor(name: string);
}
export declare class DidResolutionFailed extends Error {
    code: ErrorCode;
    constructor(did: string);
}
export declare class WritePermissionError extends Error {
    constructor();
}
export declare class APIResponseError extends Error {
    httpStatusCode: number;
    httpStatusText: string;
    httpHeaders?: Record<string, string> | undefined;
    httpResponseBody?: any;
    constructor(httpStatusCode: number, httpStatusText: string, httpHeaders?: Record<string, string> | undefined, httpResponseBody?: any);
    get code(): ErrorCode;
}
