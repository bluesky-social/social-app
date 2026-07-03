import {ComAtprotoIdentityResolveHandle} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {isNetworkError} from '#/lib/strings/errors'
import {useServiceQuery} from '#/state/queries/service'
import {createQueryKey} from '#/state/queries/util'
import {useAgent, useSession} from '#/state/session'
import {
  extractIntendedHandle,
  isServiceHandle,
  pickDiagnosis,
} from '#/features/invalidHandle/diagnostics'
import {
  type DiagnosticsReport,
  type DidDocCheck,
  type ResolutionCheck,
} from '#/features/invalidHandle/types'

export const createIdentityDiagnosticsQueryKey = (args: {did: string}) =>
  createQueryKey('invalidHandleDiagnostics', args)

/**
 * Runs server-side resolution checks to determine the likely cause of the
 * current account's handle being `handle.invalid`. Each step is individually
 * error-handled so the query always returns a report and never throws.
 */
export function useIdentityDiagnosticsQuery({enabled}: {enabled: boolean}) {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const {data: serviceInfo} = useServiceQuery(agent.serviceUrl.toString())
  const did = currentAccount?.did ?? ''
  const availableUserDomains = serviceInfo?.availableUserDomains

  return useQuery({
    queryKey: createIdentityDiagnosticsQueryKey({did}),
    enabled: enabled && !!did,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: async (): Promise<DiagnosticsReport> => {
      const raw: DiagnosticsReport['raw'] = {}

      let didDoc: DidDocCheck
      try {
        const res = await agent.com.atproto.repo.describeRepo({repo: did})
        raw.didDoc = res.data.didDoc
        raw.handleIsCorrect = res.data.handleIsCorrect
        didDoc = {
          status: 'ok',
          intendedHandle: extractIntendedHandle(res.data.didDoc),
        }
      } catch (e) {
        didDoc = {status: isNetworkError(e) ? 'network-error' : 'error'}
      }

      const intendedHandle =
        didDoc.status === 'ok' ? didDoc.intendedHandle : undefined

      let resolution: ResolutionCheck | undefined
      if (intendedHandle) {
        try {
          const res = await agent.resolveHandle({handle: intendedHandle})
          raw.resolvedDid = res.data.did
          resolution = {status: 'resolved', did: res.data.did}
        } catch (e) {
          raw.resolveError = e instanceof Error ? e.message : String(e)
          if (
            e instanceof ComAtprotoIdentityResolveHandle.HandleNotFoundError ||
            /unable to resolve handle/i.test(String(e))
          ) {
            resolution = {status: 'not-resolving'}
          } else if (isNetworkError(e)) {
            resolution = {status: 'network-error'}
          } else {
            resolution = {status: 'error'}
          }
        }
      }

      return {
        intendedHandle,
        diagnosis: pickDiagnosis({
          expectedDid: did,
          didDoc,
          isServiceHandle: intendedHandle
            ? isServiceHandle(intendedHandle, availableUserDomains ?? [])
            : false,
          resolution,
        }),
        raw,
      }
    },
  })
}
