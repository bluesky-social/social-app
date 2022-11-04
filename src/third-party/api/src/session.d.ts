import { CallOptions, Client as XrpcClient, ServiceClient as XrpcServiceClient, QueryParams, XRPCResponse } from '@atproto/xrpc';
import TypedEmitter from 'typed-emitter';
import { Client, ServiceClient } from './client';
export declare class SessionClient extends Client {
    service(serviceUri: string | URL): SessionServiceClient;
}
declare const defaultInst: SessionClient;
export default defaultInst;
export declare class SessionServiceClient extends ServiceClient {
    xrpc: SessionXrpcServiceClient;
    sessionManager: SessionManager;
    constructor(baseClient: Client, xrpcService: SessionXrpcServiceClient);
}
export declare class SessionXrpcServiceClient extends XrpcServiceClient {
    sessionManager: SessionManager;
    refreshing?: Promise<XRPCResponse>;
    constructor(baseClient: XrpcClient, serviceUri: string | URL);
    call(methodNsid: string, params?: QueryParams, data?: unknown, opts?: CallOptions): Promise<XRPCResponse>;
    refresh(opts?: CallOptions): Promise<XRPCResponse>;
    private _refresh;
}
declare const SessionManager_base: new () => TypedEmitter<SessionEvents>;
export declare class SessionManager extends SessionManager_base {
    session?: Session;
    get(): Session | undefined;
    set(session: Session): void;
    unset(): void;
    active(): boolean;
    accessHeaders(): {
        authorization: string;
    } | undefined;
    refreshHeaders(): {
        authorization: string;
    } | undefined;
}
export declare type Session = {
    refreshJwt: string;
    accessJwt: string;
};
declare type SessionEvents = {
    session: (session?: Session) => void;
};
