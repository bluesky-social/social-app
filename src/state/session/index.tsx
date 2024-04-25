import * as V1 from '#/state/session/v1'
import * as V2 from '#/state/session/v2'

export type {SessionAccount} from '#/state/session/v1'

const isV2 = false

export const useAgent = isV2 ? V2.useAgent : V1.useAgent
export const Provider = isV2 ? V2.Provider : V1.Provider
export const useSession = isV2 ? V2.useSession : V1.useSession
export const useSessionApi = isV2 ? V2.useSessionApi : V1.useSessionApi
export const useRequireAuth = isV2 ? V2.useRequireAuth : V1.useRequireAuth
