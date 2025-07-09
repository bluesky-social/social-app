import {memo, useCallback, useMemo} from 'react'
import {
  type GestureResponderEvent,
  Platform,
  Pressable,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import {sanitizeUrl} from '@braintree/sanitize-url'

import {
  type DebouncedNavigationProp,
  useNavigationDeduped,
} from '#/lib/hooks/useNavigationDeduped'
import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {getTabState, TabState} from '#/lib/routes/helpers'
import {
  convertBskyAppUrlIfNeeded,
  isExternalUrl,
  linkRequiresWarning,
} from '#/lib/strings/url-helpers'
import {type TypographyVariant} from '#/lib/ThemeContext'
import {isAndroid, isWeb} from '#/platform/detection'
import {emitSoftReset} from '#/state/events'
import {useModalControls} from '#/state/modals'
import {WebAuxClickWrapper} from '#/view/com/util/WebAuxClickWrapper'
import {useTheme} from '#/alf'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {router} from '../../../routes'
import {PressableWithHover} from './PressableWithHover'
import {Text} from './text/Text'

type Event =
  | React.MouseEvent<HTMLAnchorElement, MouseEvent>
  | GestureResponderEvent

interface Props extends React.ComponentProps<typeof TouchableOpacity> {
  testID?: string
  style?: StyleProp<ViewStyle>
  href?: string
  title?: string
  children?: React.ReactNode
  hoverStyle?: StyleProp<ViewStyle>
  noFeedback?: boolean
  asAnchor?: boolean
  dataSet?: any
  anchorNoUnderline?: boolean
  navigationAction?: 'push' | 'replace' | 'navigate'
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  onBeforePress?: () => void
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
  onBeforePress,
  accessibilityActions,
  onAccessibilityAction,
  dataSet: dataSetProp,
  ...props
}: Props) {
  const t = useTheme()
  const {closeModal} = useModalControls()
  const navigation = useNavigationDeduped()
  const anchorHref = asAnchor ? sanitizeUrl(href) : undefined
  const openLink = useOpenLink()

  const onPress = useCallback(
    (e?: Event) => {
      onBeforePress?.()
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
    [closeModal, navigation, navigationAction, href, openLink, onBeforePress],
  )

  const accessibilityActionsWithActivate = [
    ...(accessibilityActions || []),
    {name: 'activate', label: title},
  ]

  const dataSet = useMemo(() => {
    const ds = {...dataSetProp}
    if (anchorNoUnderline) {
      ds.noUnderline = 1
    }
    return ds
  }, [dataSetProp, anchorNoUnderline])

  if (noFeedback) {
    return (
      <WebAuxClickWrapper>
        <Pressable
          testID={testID}
          onPress={onPress}
          accessible={accessible}
          accessibilityRole="link"
          accessibilityActions={accessibilityActionsWithActivate}
          onAccessibilityAction={e => {
            if (e.nativeEvent.actionName === 'activate') {
              onPress()
            } else {
              onAccessibilityAction?.(e)
            }
          }}
          {...props}
          android_ripple={{
            color: t.atoms.bg_contrast_25.backgroundColor,
          }}
          unstable_pressDelay={isAndroid ? 90 : undefined}>
          {/* @ts-ignore web only -prf */}
          <View style={style} href={anchorHref}>
            {children ? children : <Text>{title || 'link'}</Text>}
          </View>
        </Pressable>
      </WebAuxClickWrapper>
    )
  }

  const Com = props.hoverStyle ? PressableWithHover : Pressable
  return (
    <Com
      testID={testID}
      style={style}
      onPress={onPress}
      accessible={accessible}
      accessibilityRole="link"
      accessibilityLabel={props.accessibilityLabel ?? title}
      accessibilityHint={props.accessibilityHint}
      // @ts-ignore web only -prf
      href={anchorHref}
      dataSet={dataSet}
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
  dataSet: dataSetProp,
  title,
  onPress: onPressProp,
  onBeforePress,
  disableMismatchWarning,
  navigationAction,
  anchorNoUnderline,
  ...props
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
  anchorNoUnderline?: boolean
  onBeforePress?: () => void
} & TextProps) {
  const navigation = useNavigationDeduped()
  const {closeModal} = useModalControls()
  const {linkWarningDialogControl} = useGlobalDialogsControlContext()
  const openLink = useOpenLink()

  if (!disableMismatchWarning && typeof text !== 'string') {
    console.error('Unable to detect mismatching label')
  }

  const dataSet = useMemo(() => {
    const ds = {...dataSetProp}
    if (anchorNoUnderline) {
      ds.noUnderline = 1
    }
    return ds
  }, [dataSetProp, anchorNoUnderline])

  const onPress = useCallback(
    (e?: Event) => {
      const requiresWarning =
        !disableMismatchWarning &&
        linkRequiresWarning(href, typeof text === 'string' ? text : '')
      if (requiresWarning) {
        e?.preventDefault?.()
        linkWarningDialogControl.open({
          displayText: typeof text === 'string' ? text : '',
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
      onBeforePress?.()
      if (onPressProp) {
        e?.preventDefault?.()
        // @ts-expect-error function signature differs by platform -prf
        return onPressProp()
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
      onBeforePress,
      onPressProp,
      closeModal,
      navigation,
      href,
      text,
      disableMismatchWarning,
      navigationAction,
      openLink,
      linkWarningDialogControl,
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
      onPress={onPress}
      accessibilityRole="link"
      href={convertBskyAppUrlIfNeeded(sanitizeUrl(href))}
      {...props}>
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
  disableMismatchWarning?: boolean
  onBeforePress?: () => void
  onPointerEnter?: () => void
  anchorNoUnderline?: boolean
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
  disableMismatchWarning,
  onBeforePress,
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
        disableMismatchWarning={disableMismatchWarning}
        onBeforePress={onBeforePress}
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
  navigation: DebouncedNavigationProp,
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

      const [routeName, params] = router.matchPath(href)
      if (navigationAction === 'push') {
        // @ts-ignore we're not able to type check on this one -prf
        navigation.dispatch(StackActions.push(routeName, params))
      } else if (navigationAction === 'replace') {
        // @ts-ignore we're not able to type check on this one -prf
        navigation.dispatch(StackActions.replace(routeName, params))
      } else if (navigationAction === 'navigate') {
        const state = navigation.getState()
        const tabState = getTabState(state, routeName)
        if (tabState === TabState.InsideAtRoot) {
          emitSoftReset()
        } else {
          // note: 'navigate' actually acts the same as 'push' nowadays
          // therefore we need to add 'pop' -sfn
          // @ts-ignore we're not able to type check on this one -prf
          navigation.navigate(routeName, params, {pop: true})
        }
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
