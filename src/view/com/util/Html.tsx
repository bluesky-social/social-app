import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {Text} from './text/Text'
import {TextLink} from './Link'
import {
  H1 as ExpoH1,
  H2 as ExpoH2,
  H3 as ExpoH3,
  H4 as ExpoH4,
} from '@expo/html-elements'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

/**
 * These utilities are used to define long documents in an html-like
 * DSL. See for instance /locale/en/privacy-policy.tsx
 */

interface IsChildProps {
  isChild?: boolean
}

// type ReactNodeWithIsChildProp =
//   | React.ReactElement<IsChildProps>
//   | React.ReactElement<IsChildProps>[]
//   | React.ReactNode

export function H1({children}: React.PropsWithChildren<{}>) {
  const styles = useStyles()
  const pal = usePalette('default')
  const typography = useTheme().typography['title-xl']
  // @ts-ignore Expo's TextStyle definition seems to have gotten away from RN's -prf
  return <ExpoH1 style={[typography, pal.text, styles.h1]}>{children}</ExpoH1>
}

export function H2({children}: React.PropsWithChildren<{}>) {
  const styles = useStyles()
  const pal = usePalette('default')
  const typography = useTheme().typography['title-lg']
  // @ts-ignore Expo's TextStyle definition seems to have gotten away from RN's -prf
  return <ExpoH2 style={[typography, pal.text, styles.h2]}>{children}</ExpoH2>
}

export function H3({children}: React.PropsWithChildren<{}>) {
  const styles = useStyles()
  const pal = usePalette('default')
  const typography = useTheme().typography.title
  // @ts-ignore Expo's TextStyle definition seems to have gotten away from RN's -prf
  return <ExpoH3 style={[typography, pal.text, styles.h3]}>{children}</ExpoH3>
}

export function H4({children}: React.PropsWithChildren<{}>) {
  const styles = useStyles()
  const pal = usePalette('default')
  const typography = useTheme().typography['title-sm']
  // @ts-ignore Expo's TextStyle definition seems to have gotten away from RN's -prf
  return <ExpoH4 style={[typography, pal.text, styles.h4]}>{children}</ExpoH4>
}

export function P({children}: React.PropsWithChildren<{}>) {
  const styles = useStyles()
  const pal = usePalette('default')
  return (
    <Text type="md" style={[pal.text, styles.p]}>
      {children}
    </Text>
  )
}

export function UL({children, isChild}: React.PropsWithChildren<IsChildProps>) {
  const styles = useStyles()
  return (
    <View style={[styles.ul, isChild && styles.ulChild]}>
      {markChildProps(children)}
    </View>
  )
}

export function OL({children, isChild}: React.PropsWithChildren<IsChildProps>) {
  const styles = useStyles()
  return (
    <View style={[styles.ol, isChild && styles.olChild]}>
      {markChildProps(children)}
    </View>
  )
}

export function LI({
  children,
  value,
}: React.PropsWithChildren<{value?: string}>) {
  const styles = useStyles()
  const pal = usePalette('default')
  return (
    <View style={styles.li}>
      <Text style={[pal.text, styles.liBullet]}>{value || <>&bull;</>}</Text>
      <Text type="md" style={[pal.text, styles.liText]}>
        {markChildProps(children)}
      </Text>
    </View>
  )
}

export function A({children, href}: React.PropsWithChildren<{href: string}>) {
  const styles = useStyles()
  const pal = usePalette('default')
  return (
    <TextLink
      type="md"
      style={[pal.link, styles.a]}
      text={children}
      href={href}
    />
  )
}

export function STRONG({children}: React.PropsWithChildren<{}>) {
  const pal = usePalette('default')
  return (
    <Text type="md-medium" style={[pal.text]}>
      {children}
    </Text>
  )
}

export function EM({children}: React.PropsWithChildren<{}>) {
  const styles = useStyles()
  const pal = usePalette('default')
  return (
    <Text type="md" style={[pal.text, styles.em]}>
      {children}
    </Text>
  )
}

function markChildProps(children: React.ReactNode) {
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement<IsChildProps>(
        child as React.ReactElement<IsChildProps>,
        {isChild: true},
      )
    }
    return child
  })
}

const useStyles = () => {
  const {isDesktop} = useWebMediaQueries()
  return StyleSheet.create({
    h1: {
      marginTop: 20,
      marginBottom: 10,
      letterSpacing: 0.8,
    },
    h2: {
      marginTop: 20,
      marginBottom: 10,
      letterSpacing: 0.8,
    },
    h3: {
      marginTop: 0,
      marginBottom: 10,
    },
    h4: {
      marginTop: 0,
      marginBottom: 10,
      fontWeight: 'bold',
    },
    p: {
      marginBottom: 10,
    },
    ul: {
      marginBottom: 10,
      paddingLeft: isDesktop ? 18 : 4,
    },
    ulChild: {
      paddingTop: 10,
      marginBottom: 0,
    },
    ol: {
      marginBottom: 10,
      paddingLeft: isDesktop ? 18 : 4,
    },
    olChild: {
      paddingTop: 10,
      marginBottom: 0,
    },
    li: {
      flexDirection: 'row',
      paddingRight: 20,
      marginBottom: 10,
    },
    liBullet: {
      paddingRight: 10,
    },
    liText: {},
    a: {
      marginBottom: 10,
    },
    em: {
      fontStyle: 'italic',
    },
  })
}
