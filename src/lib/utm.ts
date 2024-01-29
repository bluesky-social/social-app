/**
 * Resources
 *
 * Overview: https://developers.google.com/analytics/devguides/collection/protocol/v1/reference#required
 * Param reference: https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 * UTM reference: https://support.google.com/analytics/answer/10917952
 */

import React from 'react'
import {nanoid} from 'nanoid/non-secure'
import * as Linking from 'expo-linking'

import {logger} from '#/logger'
import {load, save} from '#/lib/storage'

const STORAGE_KEY = 'BSKY_UTM_PARAMS'

let PARAMS: Record<string, any> = {}

async function loadParams() {
  PARAMS = (await load(STORAGE_KEY)) || {}
}

async function upsertParams(params: Record<string, any>) {
  await loadParams() // make sure we're ready

  for (const key in params) {
    const value = params[key]

    // only overwrite if we have a new value
    if (value !== null && value !== undefined) {
      PARAMS[key] = value
    }
  }

  await save(STORAGE_KEY, PARAMS)

  logger.debug('utm: updated', {params: PARAMS})
}

export function handleIncomingURL(url: string) {
  const {searchParams} = new URL(url, 'http://throwaway.com')
  const params = Object.fromEntries(
    Array.from(searchParams.entries()).filter(([key]) =>
      key.startsWith('utm_'),
    ),
  )

  upsertParams(params)
}

export function getParams() {
  return PARAMS
}

const UTM_TO_MP: {[key: string]: string} = {
  utm_id: 'cid',
  utm_source: 'cs',
  utm_medium: 'cm',
  utm_campaign: 'cn',
  utm_term: 'ck',
  utm_content: 'cc',
  // unsure how to map these
  // utm_source_platform: '',
  // utm_creative_format: '',
  // utm_marketing_tactic: '',
}

export function getUTMParamsAsMeasurementProtocol() {
  return Object.entries(PARAMS).reduce(
    (acc, [key, value]) => {
      acc[UTM_TO_MP[key]] = value
      return acc
    },
    {
      v: 1,
      tid: 'UA-xxx', // TODO
      t: 'event',
    } as Record<string, any>,
  )
}

export function emitEvent() {
  const params = getUTMParamsAsMeasurementProtocol()
  // TODO events?
  const payload = new URLSearchParams(params).toString()
  const url = new URL('/collect', 'https://www.google-analytics.com')
  url.searchParams.set('payload_data', encodeURIComponent(payload))
  // cache-buster param
  url.searchParams.set('z', Date.now().toString() + '-' + nanoid())

  fetch(url.toString()).catch(() => {})
}

export function useUTMSetup() {
  const url = Linking.useURL()
  React.useEffect(() => {
    if (url) handleIncomingURL(url)
  }, [url])
}
