import {type ViewProps} from 'react-native'
// @ts-expect-error untyped
import {unstable_createElement} from 'react-native-web'

import {isWeb} from '#/platform/detection'

interface Props extends ViewProps {
  enabled: boolean
}

/**
 * NoSnippetWrapper prevents search engines from displaying snippets of its content.
 *
 * If running on web and enabled, wraps children in a <div> with data-nosnippet attribute.
 * Otherwise, renders children directly.
 *
 * @param enabled - Whether to apply the data-nosnippet attribute.
 * @param viewProps - Additional props for the wrapper element.
 */
export function NoSnippetWrapper({enabled, ...viewProps}: Props) {
  if (isWeb && enabled) {
    return unstable_createElement('div', {
      ...viewProps,
      'data-nosnippet': '',
    })
  }

  return <>{viewProps.children}</>
}
