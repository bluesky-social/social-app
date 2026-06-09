import {type AtpAgent} from '@atproto/api'

import {getAge} from '#/lib/strings/time'
import {logger} from '#/ageAssurance/logger'
import {EUROSKY} from '#/config/eurosky'

/**
 * Client for the mu age-assurance backend (`mu-age-service`).
 *
 * The app sources the user's *declared* age from here instead of app.bsky
 * preferences, which OAuth sessions can't read/write. Auth is an atproto
 * service-auth JWT minted per call via `com.atproto.server.getServiceAuth`,
 * which works identically on OAuth and app-password sessions. Only boolean
 * threshold flags are sent/stored - never the birthdate.
 */

export type MuAgeFlags = {over13: boolean; over16: boolean; over18: boolean}
export type MuAgeStatus = {declared: boolean} & Partial<MuAgeFlags>

const GET_STATUS = 'social.mu.age.getStatus'
const SET_STATUS = 'social.mu.age.setStatus'

export function flagsFromBirthdate(birthdate: Date): MuAgeFlags {
  const age = getAge(birthdate)
  return {over13: age >= 13, over16: age >= 16, over18: age >= 18}
}

/**
 * Rebuild a representative birthdate string from stored flags for the region
 * rule engine (which compares against ages 13/16/18). We never store the real
 * date of birth, so we synthesize one at the highest passed threshold;
 * "declared but under 13" maps to a young sentinel so the global under-13 block
 * triggers.
 */
export function birthdateFromFlags(flags: MuAgeFlags): string {
  const age = flags.over18 ? 18 : flags.over16 ? 16 : flags.over13 ? 13 : 5
  const today = new Date()
  return new Date(
    today.getFullYear() - age,
    today.getMonth(),
    today.getDate() - 1, // day before, so the age is definitely reached
  ).toISOString()
}

async function bearer(agent: AtpAgent, lxm: string): Promise<string> {
  const {data} = await agent.com.atproto.server.getServiceAuth({
    aud: EUROSKY.ageAssurance.serviceDid,
    lxm,
    exp: Math.floor(Date.now() / 1000) + 60,
  })
  return `Bearer ${data.token}`
}

export async function getMuAgeStatus(agent: AtpAgent): Promise<MuAgeStatus> {
  const authorization = await bearer(agent, GET_STATUS)
  const res = await fetch(
    `${EUROSKY.ageAssurance.serviceUrl}/xrpc/${GET_STATUS}`,
    {headers: {authorization}},
  )
  if (!res.ok) {
    throw new Error(`getMuAgeStatus: ${res.status}`)
  }
  return (await res.json()) as MuAgeStatus
}

export async function setMuAgeStatus(
  agent: AtpAgent,
  flags: MuAgeFlags,
): Promise<void> {
  const authorization = await bearer(agent, SET_STATUS)
  const res = await fetch(
    `${EUROSKY.ageAssurance.serviceUrl}/xrpc/${SET_STATUS}`,
    {
      method: 'POST',
      headers: {authorization, 'content-type': 'application/json'},
      body: JSON.stringify(flags),
    },
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    logger.error('setMuAgeStatus failed', {
      safeMessage: `${res.status} ${text}`,
    })
    throw new Error(`setMuAgeStatus: ${res.status}`)
  }
}
