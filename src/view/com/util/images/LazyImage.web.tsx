import {type StyleProp} from 'react-native'
import {type ImageStyle} from 'expo-image'

import {type LazyImageProps} from '#/view/com/util/images/LazyImage'

function getUri(source: LazyImageProps['source']): string | undefined {
  if (typeof source === 'string') {
    return source
  }
  if (source && typeof source === 'object' && 'uri' in source) {
    return source.uri
  }
  return undefined
}

function styleToCSS(style: StyleProp<ImageStyle>): React.CSSProperties {
  if (!style) return {}
  const flat = Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style
  const css: React.CSSProperties = {}
  if (flat.width !== undefined) css.width = flat.width
  if (flat.height !== undefined) css.height = flat.height
  if (flat.flex !== undefined) css.flex = flat.flex
  return css
}

/**
 * Web implementation - uses native img with loading="lazy" for
 * browser-native lazy loading to improve Lighthouse scores.
 */
export function LazyImage({
  source,
  style,
  accessibilityLabel,
  onLoad,
  contentFit = 'cover',
}: LazyImageProps) {
  const uri = getUri(source)

  if (!uri) {
    return null
  }

  return (
    <img
      src={uri}
      alt={accessibilityLabel}
      loading="lazy"
      style={{
        ...styleToCSS(style),
        objectFit: contentFit,
      }}
      onLoad={e => {
        const img = e.currentTarget
        onLoad?.({
          source: {
            width: img.naturalWidth,
            height: img.naturalHeight,
          },
        })
      }}
    />
  )
}
