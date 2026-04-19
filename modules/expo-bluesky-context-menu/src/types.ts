import {type ReactNode} from 'react'
import {type StyleProp, type ViewStyle} from 'react-native'

import {type IconWithSvgMeta} from '#/components/icons/TEMPLATE'

/**
 * Content to show during the peek preview. Discriminated by `type`; the native
 * side dispatches on it to build the right `UIViewController`.
 *
 * Only `image` is implemented on iOS today. `video` and `externalCard` are the
 * planned follow-ups; leaving them in the type keeps the JS call-sites honest.
 */
export type PreviewContent =
  | {
      type: 'image'
      uri: string
      /** Aspect ratio as width / height. */
      aspectRatio: number
    }
  | {
      type: 'video'
      uri: string
      poster?: string
      aspectRatio: number
    }
  | {
      type: 'externalCard'
      thumbUri?: string
      title: string
      description?: string
      url: string
    }

export type MenuItemSpec = {
  id: string
  label: string
  destructive?: boolean
  disabled?: boolean
  icon?: {
    paths: string[]
    viewBox: string
    strokeWidth: number
  }
}

export type MenuItemIconSource = IconWithSvgMeta

export type NativeViewProps = {
  preview?: PreviewContent
  menuItems: MenuItemSpec[]
  borderRadius: number
  onItemPress: (e: {nativeEvent: {id: string}}) => void
  onPreviewPress: (e: {nativeEvent: {}}) => void
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}
