import React from 'react'
import {
  type LayoutChangeEvent,
  ScrollView,
  Text as RNText,
  View,
} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {type AppBskyEmbedExternal} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'

import {shareUrl} from '#/lib/sharing'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {ChevronBottom_Stroke2_Corner0_Rounded as Chevron} from '#/components/icons/Chevron'
import {CodeBrackets_Stroke2_Corner0_Rounded as Code} from '#/components/icons/CodeBrackets'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

const MAX_HEIGHT = 400

interface TangledStringRecord {
  filename: string
  description: string
  contents: string
  createdAt: string
}

function parseTangledUrl(url: string): {user: string; rkey: string} | null {
  try {
    const urlp = new URL(url)
    const [, strings, user, rkey] = urlp.pathname.split('/')
    if (strings === 'strings' && user && rkey) {
      return {user, rkey}
    }
  } catch {
    // Invalid URL
  }
  return null
}

async function resolveHandleToDid(handle: string): Promise<string> {
  if (handle.startsWith('did:')) {
    return handle
  }
  const res = await fetch(
    `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
  )
  if (!res.ok) {
    throw new Error('Failed to resolve handle')
  }
  const data = await res.json()
  return data.did
}

async function getPdsUrl(did: string): Promise<string> {
  const res = await fetch(`https://plc.directory/${encodeURIComponent(did)}`)
  if (!res.ok) {
    throw new Error('Failed to resolve DID')
  }
  const doc = await res.json()
  const pdsService = doc.service?.find(
    (s: {id: string; type: string; serviceEndpoint: string}) =>
      s.id === '#atproto_pds' || s.type === 'AtprotoPersonalDataServer',
  )
  if (!pdsService?.serviceEndpoint) {
    throw new Error('No PDS found for DID')
  }
  return pdsService.serviceEndpoint
}

async function fetchTangledString(
  user: string,
  rkey: string,
): Promise<TangledStringRecord> {
  const did = await resolveHandleToDid(user)
  const pdsUrl = await getPdsUrl(did)

  const res = await fetch(
    `${pdsUrl}/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=sh.tangled.string&rkey=${encodeURIComponent(rkey)}`,
  )

  if (!res.ok) {
    throw new Error('Failed to fetch tangled string')
  }

  const data = await res.json()
  const record = data.value as TangledStringRecord

  return {
    filename: record.filename || 'code',
    description: record.description || '',
    contents: record.contents || '',
    createdAt: record.createdAt || '',
  }
}

export function TangledString({
  link,
}: {
  link: AppBskyEmbedExternal.ViewExternal
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const [footerHeight, setFooterHeight] = React.useState(97)
  const [showMore, setShowMore] = React.useState<boolean | undefined>()

  const parsed = parseTangledUrl(link.uri)

  const {data, isLoading, error} = useQuery({
    queryKey: ['tangled-string', parsed?.user, parsed?.rkey],
    queryFn: () =>
      parsed ? fetchTangledString(parsed.user, parsed.rkey) : Promise.reject(),
    enabled: !!parsed,
    staleTime: 1000 * 60 * 5,
  })

  const onShareExternal = React.useCallback(() => {
    if (link.uri && isNative) {
      shareUrl(link.uri)
    }
  }, [link.uri])

  const onFooterLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      setFooterHeight(e.nativeEvent.layout.height)
    },
    [setFooterHeight],
  )

  const onCodeLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      if (showMore !== undefined) return
      const height = e.nativeEvent.layout.height
      if (height < MAX_HEIGHT) {
        setShowMore(true)
      } else {
        setShowMore(false)
      }
    },
    [showMore, setShowMore],
  )

  const onShowMore = React.useCallback(() => {
    setShowMore(true)
  }, [setShowMore])

  if (!parsed) {
    return null
  }

  return (
    <View
      style={[
        a.transition_color,
        a.flex_col,
        a.rounded_md,
        a.overflow_hidden,
        a.w_full,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[t.atoms.bg_contrast_25]}>
        {error ? (
          <View style={[gtMobile ? a.p_lg : a.p_md]}>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              {_(msg`Failed to load code`)}
            </Text>
          </View>
        ) : isLoading || !data ? (
          <View style={[gtMobile ? a.p_lg : a.p_md]}>
            <Loader />
          </View>
        ) : (
          <View style={[a.relative]}>
            <View style={[gtMobile ? a.pt_lg : a.pt_md, a.relative]}>
              <ScrollView
                style={[
                  a.overflow_hidden,
                  showMore === undefined || showMore === false
                    ? {maxHeight: MAX_HEIGHT}
                    : {},
                ]}>
                <ScrollView
                  horizontal
                  onLayout={onCodeLayout}
                  style={[{paddingBottom: footerHeight}]}>
                  <View>
                    <View
                      style={[
                        a.flex_row,
                        a.align_center,
                        a.gap_xs,
                        gtMobile ? a.px_lg : a.px_md,
                        a.pb_md,
                      ]}>
                      <Code
                        size="xs"
                        style={[
                          a.transition_color,
                          {color: t.palette.primary_500},
                        ]}
                      />
                      <Text
                        style={[
                          a.text_sm,
                          a.italic,
                          t.atoms.text_contrast_low,
                        ]}>
                        {data.filename}
                      </Text>
                    </View>
                    <RNText
                      selectable
                      style={[
                        gtMobile ? a.px_lg : a.px_md,
                        t.atoms.text,
                        {fontFamily: 'monospace'},
                      ]}>
                      {data.contents.trimEnd()}
                    </RNText>
                  </View>
                </ScrollView>
              </ScrollView>

              {showMore === false && <View style={[a.absolute, a.inset_0]} />}
            </View>

            <View
              style={[
                a.absolute,
                a.inset_0,
                gtMobile ? a.p_lg : a.p_md,
                {top: 'auto'},
              ]}
              onLayout={onFooterLayout}>
              <LinearGradient
                colors={[
                  t.name === 'light'
                    ? 'rgba(239, 241, 244, 0)'
                    : 'rgba(0, 17, 36, 0)',
                  t.name === 'light'
                    ? 'rgba(239, 241, 244, 0.8)'
                    : 'rgba(0, 17, 36, 0.8)',
                ]}
                locations={[0, 1]}
                start={{x: 0, y: 0}}
                end={{x: 0, y: 1}}
                style={[a.absolute, a.inset_0]}
              />
              {showMore === false && (
                <View style={[a.flex_row, a.justify_center, a.pb_md]}>
                  <Button
                    label={_(msg`Show more`)}
                    size="small"
                    variant="solid"
                    color="primary"
                    style={[a.rounded_full, {paddingVertical: 6}]}
                    onPress={onShowMore}>
                    <ButtonText>{_(msg`Show more`)}</ButtonText>
                    <ButtonIcon icon={Chevron} size="sm" position="right" />
                  </Button>
                </View>
              )}

              <Link
                label={link.title || _(msg`Open on tangled.sh`)}
                to={link.uri}
                onLongPress={onShareExternal}>
                {({hovered}) => (
                  <View
                    style={[
                      a.flex_1,
                      a.pt_sm,
                      a.rounded_sm,
                      a.border,
                      {gap: 3},
                      t.atoms.bg,
                      hovered
                        ? t.atoms.border_contrast_high
                        : t.atoms.border_contrast_low,
                    ]}>
                    <View style={[{gap: 3}, a.pb_xs, a.px_md]}>
                      <Text
                        emoji
                        numberOfLines={2}
                        style={[a.text_md, a.font_bold, a.leading_snug]}>
                        {link.title || data.filename}
                      </Text>
                      {(link.description || data.description) && (
                        <Text
                          numberOfLines={1}
                          style={[a.text_sm, t.atoms.text_contrast_medium]}>
                          {link.description || data.description}
                        </Text>
                      )}
                    </View>
                    <View style={[a.px_md]}>
                      <Divider
                        style={[
                          hovered
                            ? t.atoms.border_contrast_high
                            : t.atoms.border_contrast_low,
                        ]}
                      />
                      <View
                        style={[
                          a.flex_row,
                          a.align_center,
                          a.gap_xs,
                          a.pb_sm,
                          {paddingTop: 6},
                        ]}>
                        <Globe
                          size="xs"
                          style={[
                            a.transition_color,
                            hovered
                              ? t.atoms.text_contrast_high
                              : t.atoms.text_contrast_low,
                          ]}
                        />
                        <Text
                          numberOfLines={1}
                          style={[
                            a.transition_color,
                            a.text_xs,
                            a.leading_tight,
                            hovered
                              ? t.atoms.text_contrast_high
                              : t.atoms.text_contrast_medium,
                          ]}>
                          {toNiceDomain(link.uri)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </Link>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

export function isTangledStringUrl(url: string): boolean {
  try {
    const urlp = new URL(url)
    if (
      urlp.hostname === 'tangled.sh' ||
      urlp.hostname === 'www.tangled.sh' ||
      urlp.hostname === 'tangled.org' ||
      urlp.hostname === 'www.tangled.org'
    ) {
      const [, strings, user, rkey] = urlp.pathname.split('/')
      return strings === 'strings' && !!user && !!rkey
    }
  } catch {
    // Invalid URL
  }
  return false
}
