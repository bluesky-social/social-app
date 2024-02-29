import React, {ComponentProps, memo, useMemo} from 'react'
import {
  GestureResponderEvent,
  Platform,
  StyleProp,
  TextStyle,
  TextProps,
  View,
  ViewStyle,
  Pressable,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native'
import {
  useLinkProps,
  useNavigation,
  StackActions,
} from '@react-navigation/native'
import {Text} from './text/Text'
import {TypographyVariant} from 'lib/ThemeContext'
import {NavigationProp} from 'lib/routes/types'
import {router} from '../../../routes'
import {
  convertBskyAppUrlIfNeeded,
  isExternalUrl,
  linkRequiresWarning,
} from 'lib/strings/url-helpers'
import {isAndroid, isWeb} from 'platform/detection'
import {sanitizeUrl} from '@braintree/sanitize-url'
import {PressableWithHover} from './PressableWithHover'
import FixedTouchableHighlight from '../pager/FixedTouchableHighlight'
import {useModalControls} from '#/state/modals'
import {useOpenLink} from '#/state/preferences/in-app-browser'
import {WebAuxClickWrapper} from 'view/com/util/WebAuxClickWrapper'

type Event =
  | React.MouseEvent<HTMLAnchorElement, MouseEvent>
  | GestureResponderEvent

interface Props extends ComponentProps<typeof TouchableOpacity> {
  testID?: string
  style?: StyleProp<ViewStyle>
  href?: string
  title?: string
  children?: React.ReactNode
  hoverStyle?: StyleProp<ViewStyle>
  noFeedback?: boolean
  asAnchor?: boolean
  anchorNoUnderline?: boolean
  navigationAction?: 'push' | 'replace' | 'navigate'
  onPointerEnter?: () => void
}

export const Link = memo(function Link({
  testID,
  style,
  href,
  title,
  children,
  noFeedback,
  asAnchor,
  accessible,
  anchorNoUnderline,
  navigationAction,
  ...props
}: Props) {
  const {closeModal} = useModalControls()
  const navigation = useNavigation<NavigationProp>()
  const anchorHref = asAnchor ? sanitizeUrl(href) : undefined
  const openLink = useOpenLink()

  const onPress = React.useCallback(
    (e?: Event) => {
      if (typeof href === 'string') {
        return onPressInner(
          closeModal,
          navigation,
          sanitizeUrl(href),
          navigationAction,
          openLink,
          e,
        )
      }
    },
    [closeModal, navigation, navigationAction, href, openLink],
  )

  if (noFeedback) {
    if (isAndroid) {
      // workaround for Android not working well with left/right swipe gestures and TouchableWithoutFeedback
      // https://github.com/callstack/react-native-pager-view/issues/424
      return (
        <FixedTouchableHighlight
          testID={testID}
          onPress={onPress}
          // @ts-ignore web only -prf
          href={asAnchor ? sanitizeUrl(href) : undefined}
          accessible={accessible}
          accessibilityRole="link"
          {...props}>
          <View style={style}>
            {children ? children : <Text>{title || 'link'}</Text>}
          </View>
        </FixedTouchableHighlight>
      )
    }
    return (
      <WebAuxClickWrapper>
        <TouchableWithoutFeedback
          testID={testID}
          onPress={onPress}
          accessible={accessible}
          accessibilityRole="link"
          {...props}>
          {/* @ts-ignore web only -prf */}
          <View style={style} href={anchorHref}>
            {children ? children : <Text>{title || 'link'}</Text>}
          </View>
        </TouchableWithoutFeedback>
      </WebAuxClickWrapper>
    )
  }

  if (anchorNoUnderline) {
    // @ts-ignore web only -prf
    props.dataSet = props.dataSet || {}
    // @ts-ignore web only -prf
    props.dataSet.noUnderline = 1
  }

  if (title && !props.accessibilityLabel) {
    props.accessibilityLabel = title
  }

  const Com = props.hoverStyle ? PressableWithHover : Pressable
  return (
    <Com
      testID={testID}
      style={style}
      onPress={onPress}
      accessible={accessible}
      accessibilityRole="link"
      // @ts-ignore web only -prf
      href={anchorHref}
      {...props}>
      {children ? children : <Text>{title || 'link'}</Text>}
    </Com>
  )
})

export const TextLink = memo(function TextLink({
  testID,
  type = 'md',
  style,
  href,
  text,
  numberOfLines,
  lineHeight,
  dataSet,
  title,
  onPress,
  disableMismatchWarning,
  navigationAction,
  ...orgProps
}: {
  testID?: string
  type?: TypographyVariant
  style?: StyleProp<TextStyle>
  href: string
  text: string | JSX.Element | React.ReactNode
  numberOfLines?: number
  lineHeight?: number
  dataSet?: any
  title?: string
  disableMismatchWarning?: boolean
  navigationAction?: 'push' | 'replace' | 'navigate'
} & TextProps) {
  const {...props} = useLinkProps({to: sanitizeUrl(href)})
  const navigation = useNavigation<NavigationProp>()
  const {openModal, closeModal} = useModalControls()
  const openLink = useOpenLink()

  if (!disableMismatchWarning && typeof text !== 'string') {
    console.error('Unable to detect mismatching label')
  }

  props.onPress = React.useCallback(
    (e?: Event) => {
      const requiresWarning =
        !disableMismatchWarning &&
        linkRequiresWarning(href, typeof text === 'string' ? text : '')
      if (requiresWarning) {
        e?.preventDefault?.()
        openModal({
          name: 'link-warning',
          text: typeof text === 'string' ? text : '',
          href,
        })
      }
      if (
        isWeb &&
        href !== '#' &&
        e != null &&
        isModifiedEvent(e as React.MouseEvent)
      ) {
        // Let the browser handle opening in new tab etc.
        return
      }
      if (onPress) {
        e?.preventDefault?.()
        // @ts-ignore function signature differs by platform -prf
        return onPress()
      }
      return onPressInner(
        closeModal,
        navigation,
        sanitizeUrl(href),
        navigationAction,
        openLink,
        e,
      )
    },
    [
      onPress,
      closeModal,
      openModal,
      navigation,
      href,
      text,
      disableMismatchWarning,
      navigationAction,
      openLink,
    ],
  )
  const hrefAttrs = useMemo(() => {
    const isExternal = isExternalUrl(href)
    if (isExternal) {
      return {
        target: '_blank',
        // rel: 'noopener noreferrer',
      }
    }
    return {}
  }, [href])

  return (
    <Text
      testID={testID}
      type={type}
      style={style}
      numberOfLines={numberOfLines}
      lineHeight={lineHeight}
      dataSet={dataSet}
      title={title}
      // @ts-ignore web only -prf
      hrefAttrs={hrefAttrs} // hack to get open in new tab to work on safari. without this, safari will open in a new window
      {...props}
      {...orgProps}>
      {text}
    </Text>
  )
})

/**
 * Only acts as a link on desktop web
 */
interface TextLinkOnWebOnlyProps extends TextProps {
  testID?: string
  type?: TypographyVariant
  style?: StyleProp<TextStyle>
  href: string
  text: string | JSX.Element
  numberOfLines?: number
  lineHeight?: number
  accessible?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
  title?: string
  navigationAction?: 'push' | 'replace' | 'navigate'
  onPointerEnter?: () => void
}
export const TextLinkOnWebOnly = memo(function DesktopWebTextLink({
  testID,
  type = 'md',
  style,
  href,
  text,
  numberOfLines,
  lineHeight,
  navigationAction,
  ...props
}: TextLinkOnWebOnlyProps) {
  if (isWeb) {
    return (
      <TextLink
        testID={testID}
        type={type}
        style={style}
        href={href}
        text={text}
        numberOfLines={numberOfLines}
        lineHeight={lineHeight}
        title={props.title}
        navigationAction={navigationAction}
        {...props}
      />
    )
  }
  return (
    <Text
      testID={testID}
      type={type}
      style={style}
      numberOfLines={numberOfLines}
      lineHeight={lineHeight}
      title={props.title}
      {...props}>
      {text}
    </Text>
  )
})

const EXEMPT_PATHS = ['/robots.txt', '/security.txt', '/.well-known/']

// NOTE
// we can't use the onPress given by useLinkProps because it will
// match most paths to the HomeTab routes while we actually want to
// preserve the tab the app is currently in
//
// we also have some additional behaviors - closing the current modal,
// converting bsky urls, and opening http/s links in the system browser
//
// this method copies from the onPress implementation but adds our
// needed customizations
// -prf
function onPressInner(
  closeModal = () => {},
  navigation: NavigationProp,
  href: string,
  navigationAction: 'push' | 'replace' | 'navigate' = 'push',
  openLink: (href: string) => void,
  e?: Event,
) {
  let shouldHandle = false
  const isLeftClick =
    // @ts-ignore Web only -prf
    Platform.OS === 'web' && (e.button == null || e.button === 0)
  // @ts-ignore Web only -prf
  const isMiddleClick = Platform.OS === 'web' && e.button === 1
  const isMetaKey =
    // @ts-ignore Web only -prf
    Platform.OS === 'web' && (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
  const newTab = isMetaKey || isMiddleClick

  if (Platform.OS !== 'web' || !e) {
    shouldHandle = e ? !e.defaultPrevented : true
  } else if (
    !e.defaultPrevented && // onPress prevented default
    (isLeftClick || isMiddleClick) && // ignore everything but left and middle clicks
    // @ts-ignore Web only -prf
    [undefined, null, '', 'self'].includes(e.currentTarget?.target) // let browser handle "target=_blank" etc.
  ) {
    e.preventDefault()
    shouldHandle = true
  }

  if (shouldHandle) {
    href = convertBskyAppUrlIfNeeded(href)
    if (
      newTab ||
      href.startsWith('http') ||
      href.startsWith('mailto') ||
      EXEMPT_PATHS.some(path => href.startsWith(path))
    ) {
      openLink(href)
    } else {
      closeModal() // close any active modals

      if (navigationAction === 'push') {
        // @ts-ignore we're not able to type check on this one -prf
        navigation.dispatch(StackActions.push(...router.matchPath(href)))
      } else if (navigationAction === 'replace') {
        // @ts-ignore we're not able to type check on this one -prf
        navigation.dispatch(StackActions.replace(...router.matchPath(href)))
      } else if (navigationAction === 'navigate') {
        // @ts-ignore we're not able to type check on this one -prf
        navigation.navigate(...router.matchPath(href))
      } else {
        throw Error('Unsupported navigator action.')
      }
    }
  }
}

function isModifiedEvent(e: React.MouseEvent): boolean {
  const eventTarget = e.currentTarget as HTMLAnchorElement
  const target = eventTarget.getAttribute('target')
  return (
    (target && target !== '_self') ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    (e.nativeEvent && e.nativeEvent.which === 2)
  )
}
