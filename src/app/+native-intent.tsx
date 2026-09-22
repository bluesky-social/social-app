import {getCurrentPath} from '#/lib/navigation'
import {nativeIntentPath} from '#/lib/navigation/nativeIntent'

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string
  initial: boolean
}) {
  return nativeIntentPath(path, initial ? undefined : getCurrentPath())
}
