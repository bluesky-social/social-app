/* eslint-disable @typescript-eslint/no-explicit-any */
import {getGatekeeperUrl} from '#/lib/blacksky-pds'

class GatekeeperError extends Error {
  constructor(
    public status: number,
    public errorType: string,
    message: string,
  ) {
    super(message)
    this.name = 'GatekeeperError'
  }
}

async function gatekeeperPost(
  serviceUrl: string,
  path: string,
  body: Record<string, unknown>,
): Promise<any> {
  const base = getGatekeeperUrl(serviceUrl)
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let errorType = 'UnknownError'
    let message = `Request failed with status ${res.status}`
    try {
      const json = (await res.json()) as {error?: string; message?: string}
      errorType = json.error || errorType
      message = json.message || message
    } catch {}
    throw new GatekeeperError(res.status, errorType, message)
  }

  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

export async function gateUpdateEmail(params: {
  serviceUrl: string
  did: string
  password: string
  email: string
  token?: string
  emailAuthFactor?: boolean
}): Promise<{status: 'success' | 'tokenRequired'}> {
  const body: Record<string, unknown> = {
    did: params.did,
    password: params.password,
    email: params.email,
  }
  if (params.token) {
    body.token = params.token
  }
  if (params.emailAuthFactor !== undefined) {
    body.emailAuthFactor = params.emailAuthFactor
  }

  try {
    await gatekeeperPost(params.serviceUrl, '/gate/update-email', body)
    return {status: 'success'}
  } catch (e) {
    if (e instanceof GatekeeperError && e.errorType === 'TokenRequired') {
      return {status: 'tokenRequired'}
    }
    throw e
  }
}

export async function gateRequestAccountDelete(params: {
  serviceUrl: string
  did: string
  password: string
}): Promise<void> {
  await gatekeeperPost(params.serviceUrl, '/gate/request-account-delete', {
    did: params.did,
    password: params.password,
  })
}

export async function gateDeactivateAccount(params: {
  serviceUrl: string
  did: string
  password: string
}): Promise<void> {
  await gatekeeperPost(params.serviceUrl, '/gate/deactivate-account', {
    did: params.did,
    password: params.password,
  })
}

export async function gateListAppPasswords(params: {
  serviceUrl: string
  did: string
  password: string
}): Promise<{
  passwords: {name: string; createdAt: string; privileged?: boolean}[]
}> {
  return await gatekeeperPost(params.serviceUrl, '/gate/list-app-passwords', {
    did: params.did,
    password: params.password,
  })
}

export async function gateCreateAppPassword(params: {
  serviceUrl: string
  did: string
  password: string
  name: string
  privileged?: boolean
}): Promise<{
  name: string
  password: string
  createdAt: string
  privileged?: boolean
}> {
  return await gatekeeperPost(params.serviceUrl, '/gate/create-app-password', {
    did: params.did,
    password: params.password,
    name: params.name,
    privileged: params.privileged,
  })
}

export async function gateRevokeAppPassword(params: {
  serviceUrl: string
  did: string
  password: string
  name: string
}): Promise<void> {
  await gatekeeperPost(params.serviceUrl, '/gate/revoke-app-password', {
    did: params.did,
    password: params.password,
    name: params.name,
  })
}

export async function gateGetPreferences(params: {
  serviceUrl: string
  did: string
  password: string
}): Promise<{preferences: any[]}> {
  return await gatekeeperPost(params.serviceUrl, '/gate/get-preferences', {
    did: params.did,
    password: params.password,
  })
}

export async function gatePutPreferences(params: {
  serviceUrl: string
  did: string
  password: string
  preferences: unknown
  authFactorToken?: string
}): Promise<{status: 'success' | 'authFactorTokenRequired'}> {
  const body: Record<string, unknown> = {
    did: params.did,
    password: params.password,
    preferences: params.preferences,
  }
  if (params.authFactorToken) {
    body.authFactorToken = params.authFactorToken
  }

  try {
    await gatekeeperPost(params.serviceUrl, '/gate/put-preferences', body)
    return {status: 'success'}
  } catch (e) {
    if (
      e instanceof GatekeeperError &&
      e.errorType === 'AuthFactorTokenRequired'
    ) {
      return {status: 'authFactorTokenRequired'}
    }
    throw e
  }
}
