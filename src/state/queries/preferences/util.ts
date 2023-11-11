import {LabelPreference} from '@atproto/api'

/**
 * Content labels previously included 'show', which has been deprecated in
 * favor of 'ignore'. The API can return legacy data from the database, and
 * we clean up the data in `usePreferencesQuery`.
 *
 * @deprecated
 */
export function temp__migrateLabelPref(
  pref: LabelPreference | 'show',
): LabelPreference {
  // @ts-ignore
  if (pref === 'show') return 'ignore'
  return pref
}
