import {type I18n} from '@lingui/core'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'

export function getUserDisplayName<
  T extends {displayName?: string; handle: string; [key: string]: any},
>(i18n: I18n, props: T): string {
  return sanitizeDisplayName(
    props.displayName || sanitizeHandle(i18n, props.handle, '@'),
  )
}
