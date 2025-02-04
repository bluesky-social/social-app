export enum Group {
  Wayfinding = 'wayfinding',
  Composer = 'composer',
}

export type Flags = {
  'wayfinding:settings': boolean
  'wayfinding:settings:moderation': boolean
  'composer:threadgate_20250204': boolean
}

export type Flag = keyof Flags

// existing users?
export const flags: Flags = {
  'wayfinding:settings': true,
  'wayfinding:settings:moderation': true,
  'composer:threadgate_20250204': false,
}

export const flagKeys = Object.keys(flags) as (keyof typeof flags)[]
