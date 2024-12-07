import React from 'react'

import {deviceLocales} from '#/locale/deviceLocales'
import {useGeolocation} from '#/state/geolocation'
import {useLanguagePrefs} from '#/state/preferences'

/**
 * From react-native-localize
 *
 * MIT License
 * Copyright (c) 2017-present, Mathieu Acthernoene
 *
 * @see https://github.com/zoontek/react-native-localize/blob/master/LICENSE
 * @see https://github.com/zoontek/react-native-localize/blob/ee5bf25e0bb8f3b8e4f3fd055f67ad46269c81ea/src/constants.ts
 */
export const countryCodeToCurrency: Record<string, string> = {
  ad: 'eur',
  ae: 'aed',
  af: 'afn',
  ag: 'xcd',
  ai: 'xcd',
  al: 'all',
  am: 'amd',
  an: 'ang',
  ao: 'aoa',
  ar: 'ars',
  as: 'usd',
  at: 'eur',
  au: 'aud',
  aw: 'awg',
  ax: 'eur',
  az: 'azn',
  ba: 'bam',
  bb: 'bbd',
  bd: 'bdt',
  be: 'eur',
  bf: 'xof',
  bg: 'bgn',
  bh: 'bhd',
  bi: 'bif',
  bj: 'xof',
  bl: 'eur',
  bm: 'bmd',
  bn: 'bnd',
  bo: 'bob',
  bq: 'usd',
  br: 'brl',
  bs: 'bsd',
  bt: 'btn',
  bv: 'nok',
  bw: 'bwp',
  by: 'byn',
  bz: 'bzd',
  ca: 'cad',
  cc: 'aud',
  cd: 'cdf',
  cf: 'xaf',
  cg: 'xaf',
  ch: 'chf',
  ci: 'xof',
  ck: 'nzd',
  cl: 'clp',
  cm: 'xaf',
  cn: 'cny',
  co: 'cop',
  cr: 'crc',
  cu: 'cup',
  cv: 'cve',
  cw: 'ang',
  cx: 'aud',
  cy: 'eur',
  cz: 'czk',
  de: 'eur',
  dj: 'djf',
  dk: 'dkk',
  dm: 'xcd',
  do: 'dop',
  dz: 'dzd',
  ec: 'usd',
  ee: 'eur',
  eg: 'egp',
  eh: 'mad',
  er: 'ern',
  es: 'eur',
  et: 'etb',
  fi: 'eur',
  fj: 'fjd',
  fk: 'fkp',
  fm: 'usd',
  fo: 'dkk',
  fr: 'eur',
  ga: 'xaf',
  gb: 'gbp',
  gd: 'xcd',
  ge: 'gel',
  gf: 'eur',
  gg: 'gbp',
  gh: 'ghs',
  gi: 'gip',
  gl: 'dkk',
  gm: 'gmd',
  gn: 'gnf',
  gp: 'eur',
  gq: 'xaf',
  gr: 'eur',
  gs: 'gbp',
  gt: 'gtq',
  gu: 'usd',
  gw: 'xof',
  gy: 'gyd',
  hk: 'hkd',
  hm: 'aud',
  hn: 'hnl',
  hr: 'hrk',
  ht: 'htg',
  hu: 'huf',
  id: 'idr',
  ie: 'eur',
  il: 'ils',
  im: 'gbp',
  in: 'inr',
  io: 'usd',
  iq: 'iqd',
  ir: 'irr',
  is: 'isk',
  it: 'eur',
  je: 'gbp',
  jm: 'jmd',
  jo: 'jod',
  jp: 'jpy',
  ke: 'kes',
  kg: 'kgs',
  kh: 'khr',
  ki: 'aud',
  km: 'kmf',
  kn: 'xcd',
  kp: 'kpw',
  kr: 'krw',
  kw: 'kwd',
  ky: 'kyd',
  kz: 'kzt',
  la: 'lak',
  lb: 'lbp',
  lc: 'xcd',
  li: 'chf',
  lk: 'lkr',
  lr: 'lrd',
  ls: 'lsl',
  lt: 'eur',
  lu: 'eur',
  lv: 'eur',
  ly: 'lyd',
  ma: 'mad',
  mc: 'eur',
  md: 'mdl',
  me: 'eur',
  mf: 'eur',
  mg: 'mga',
  mh: 'usd',
  mk: 'mkd',
  ml: 'xof',
  mm: 'mmk',
  mn: 'mnt',
  mo: 'mop',
  mp: 'usd',
  mq: 'eur',
  mr: 'mro',
  ms: 'xcd',
  mt: 'eur',
  mu: 'mur',
  mv: 'mvr',
  mw: 'mwk',
  mx: 'mxn',
  my: 'myr',
  mz: 'mzn',
  na: 'nad',
  nc: 'xpf',
  ne: 'xof',
  nf: 'aud',
  ng: 'ngn',
  ni: 'nio',
  nl: 'eur',
  no: 'nok',
  np: 'npr',
  nr: 'aud',
  nu: 'nzd',
  nz: 'nzd',
  om: 'omr',
  pa: 'pab',
  pe: 'pen',
  pf: 'xpf',
  pg: 'pgk',
  ph: 'php',
  pk: 'pkr',
  pl: 'pln',
  pm: 'eur',
  pn: 'nzd',
  pr: 'usd',
  ps: 'ils',
  pt: 'eur',
  pw: 'usd',
  py: 'pyg',
  qa: 'qar',
  re: 'eur',
  ro: 'ron',
  rs: 'rsd',
  ru: 'rub',
  rw: 'rwf',
  sa: 'sar',
  sb: 'sbd',
  sc: 'scr',
  sd: 'sdg',
  se: 'sek',
  sg: 'sgd',
  sh: 'shp',
  si: 'eur',
  sj: 'nok',
  sk: 'eur',
  sl: 'sll',
  sm: 'eur',
  sn: 'xof',
  so: 'sos',
  sr: 'srd',
  ss: 'ssp',
  st: 'std',
  sv: 'svc',
  sx: 'ang',
  sy: 'syp',
  sz: 'szl',
  tc: 'usd',
  td: 'xaf',
  tf: 'eur',
  tg: 'xof',
  th: 'thb',
  tj: 'tjs',
  tk: 'nzd',
  tl: 'usd',
  tm: 'tmt',
  tn: 'tnd',
  to: 'top',
  tr: 'try',
  tt: 'ttd',
  tv: 'aud',
  tw: 'twd',
  tz: 'tzs',
  ua: 'uah',
  ug: 'ugx',
  um: 'usd',
  us: 'usd',
  uy: 'uyu',
  uz: 'uzs',
  va: 'eur',
  vc: 'xcd',
  ve: 'vef',
  vg: 'usd',
  vi: 'usd',
  vn: 'vnd',
  vu: 'vuv',
  wf: 'xpf',
  ws: 'wst',
  ye: 'yer',
  yt: 'eur',
  za: 'zar',
  zm: 'zmw',
  zw: 'zwl',
}

/**
 * Best-guess currency formatting.
 *
 * Attempts to use `getLocales` from `expo-localization` if available,
 * otherwise falls back to the `persisted.appLanguage` setting, and geolocation
 * API for region.
 */
export function useFormatCurrency(
  options?: Parameters<typeof Intl.NumberFormat>[1],
) {
  const {geolocation} = useGeolocation()
  const {appLanguage} = useLanguagePrefs()
  return React.useMemo(() => {
    const locale = deviceLocales.at(0)
    const languageTag = locale?.languageTag || appLanguage || 'en-US'
    const countryCode = (
      locale?.regionCode ||
      geolocation?.countryCode ||
      'us'
    ).toLowerCase()
    const currency = countryCodeToCurrency[countryCode] || 'usd'
    const format = new Intl.NumberFormat(languageTag, {
      ...(options || {}),
      style: 'currency',
      currency: currency,
    }).format

    return {
      format,
      currency,
      countryCode,
      languageTag,
    }
  }, [geolocation, appLanguage, options])
}
