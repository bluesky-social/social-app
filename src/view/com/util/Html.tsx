import React from 'react'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from './text/Text'
import {TextLink} from './Link'
import {isDesktopWeb} from 'platform/detection'

/**
 * These utilities are used to define long documents in an html-like
 * DSL. See for instance /locale/en/privacy-policy.tsx
 */

export function H1({children}: React.PropsWithChildren<{}>) {
  const pal = usePalette('default')
  return (
    <Text type="title-xl" style={[pal.text, styles.h1]}>
      {children}
    </Text>
  )
}

export function H2({children}: React.PropsWithChildren<{}>) {
  const pal = usePalette('default')
  return (
    <Text type="title-lg" style={[pal.text, styles.h2]}>
      {children}
    </Text>
  )
}

export function H3({children}: React.PropsWithChildren<{}>) {
  const pal = usePalette('default')
  return (
    <Text type="title" style={[pal.text, styles.h3]}>
      {children}
    </Text>
  )
}

export function H4({children}: React.PropsWithChildren<{}>) {
  const pal = usePalette('default')
  return (
    <Text type="title-sm" style={[pal.text, styles.h4]}>
      {children}
    </Text>
  )
}

export function P({children}: React.PropsWithChildren<{}>) {
  const pal = usePalette('default')
  return (
    <Text type="md" style={[pal.text, styles.p]}>
      {children}
    </Text>
  )
}

export function UL({
  children,
  isChild,
}: React.PropsWithChildren<{isChild: boolean}>) {
  return (
    <View style={[styles.ul, isChild && styles.ulChild]}>
      {markChildProps(children)}
    </View>
  )
}

export function OL({
  children,
  isChild,
}: React.PropsWithChildren<{isChild: boolean}>) {
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
  const pal = usePalette('default')
  return (
    <Text type="md" style={[pal.text, styles.em]}>
      {children}
    </Text>
  )
}

function markChildProps(children) {
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {isChild: true})
    }
    return child
  })
}

const styles = StyleSheet.create({
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
    marginBottom: 10,
  },
  h4: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  p: {
    marginBottom: 10,
  },
  ul: {
    marginBottom: 10,
    paddingLeft: isDesktopWeb ? 18 : 4,
  },
  ulChild: {
    paddingTop: 10,
    marginBottom: 0,
  },
  ol: {
    marginBottom: 10,
    paddingLeft: isDesktopWeb ? 18 : 4,
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
