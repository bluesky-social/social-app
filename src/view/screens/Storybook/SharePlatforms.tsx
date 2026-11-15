import {useState} from 'react'
import {Linking, View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {
  SHARE_PLATFORMS,
  type SharePlatform,
  type SharePlatformId,
} from '#/components/ShareDialog/catalog'
import {getInstalledSharePlatforms} from '#/components/ShareDialog/detect'
import {openSharePlatform} from '#/components/ShareDialog/share'
import {Text} from '#/components/Typography'
import {IS_ANDROID, IS_IOS, IS_NATIVE} from '#/env'

const CONTENT = {
  url: 'https://bsky.app/profile/bsky.app',
  title: 'Post by @bsky.app on Bluesky',
}

/**
 * Links that research couldn't confirm, to settle on a device which one, if
 * any, opens the app with the link filled in.
 */
const ALTERNATIVES: {label: string; url: string}[] = [
  {
    label: 'X web intent (/intent/tweet)',
    url: `https://x.com/intent/tweet?url=${encodeURIComponent(CONTENT.url)}`,
  },
  {
    label: 'X web intent (/intent/post)',
    url: `https://x.com/intent/post?text=${encodeURIComponent(CONTENT.url)}`,
  },
  {
    label: 'Facebook sharer.php',
    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(CONTENT.url)}`,
  },
  {
    label: 'Messenger fb-messenger://share',
    url: `fb-messenger://share/?link=${encodeURIComponent(CONTENT.url)}`,
  },
  {
    label: 'Reddit /submit/ (trailing slash)',
    url: `https://www.reddit.com/submit/?url=${encodeURIComponent(CONTENT.url)}&title=${encodeURIComponent(CONTENT.title)}`,
  },
  {
    label: 'Discord discord://send (unconfirmed)',
    url: `discord://send?message=${encodeURIComponent(CONTENT.url)}`,
  },
]

function describeMethod(platform: SharePlatform) {
  if (IS_IOS) {
    if (!platform.ios) return 'not supported'
    return platform.ios.copyAndOpen
      ? `copy & open ${platform.ios.scheme}://`
      : 'link'
  }
  if (IS_ANDROID) {
    if (!platform.android) return 'not supported'
    return platform.android.directShare ? 'direct share' : 'link'
  }
  return 'not supported'
}

/**
 * Device testing for the share sheet's app row: which catalog apps are
 * detected, and whether each one opens with the link filled in.
 */
export function SharePlatforms() {
  const t = useTheme()
  const [installed, setInstalled] = useState<SharePlatformId[] | null>(null)
  const [results, setResults] = useState<Record<string, string>>({})

  const setResult = (key: string, result: string) =>
    setResults(prev => ({...prev, [key]: result}))

  const detect = async () => {
    setInstalled(await getInstalledSharePlatforms())
  }

  const open = async (id: SharePlatformId) => {
    try {
      const {copiedLink} = await openSharePlatform(id, CONTENT)
      setResult(id, copiedLink ? 'copied link, opened app' : 'opened')
    } catch (e) {
      setResult(id, `failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const openAlternative = async (url: string) => {
    try {
      await Linking.openURL(url)
      setResult(url, 'opened')
    } catch (e) {
      setResult(url, `failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <View style={[a.gap_md]}>
      <Text style={[a.font_bold, a.text_5xl]}>Share platforms</Text>
      {!IS_NATIVE ? (
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          Native only.
        </Text>
      ) : (
        <>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            Detect, then open each app and check the link is filled in. Shares
            {` ${CONTENT.url}`}.
          </Text>
          <Button
            label="Detect installed apps"
            size="small"
            color="primary"
            onPress={() => void detect()}>
            <ButtonText>Detect installed apps</ButtonText>
          </Button>

          <View style={[a.gap_sm]}>
            {SHARE_PLATFORMS.map(platform => {
              const method = describeMethod(platform)
              const supported = method !== 'not supported'
              const status =
                installed === null
                  ? 'not checked'
                  : installed.includes(platform.id)
                    ? 'installed'
                    : 'not detected'
              return (
                <View
                  key={platform.id}
                  style={[a.flex_row, a.align_center, a.gap_md]}>
                  <Button
                    label={`Open ${platform.label}`}
                    size="small"
                    color="secondary"
                    disabled={!supported}
                    onPress={() => void open(platform.id)}>
                    <ButtonText>{platform.label}</ButtonText>
                  </Button>
                  <Text
                    style={[a.flex_1, a.text_sm, t.atoms.text_contrast_medium]}>
                    {method}
                    {supported ? ` · ${status}` : ''}
                    {results[platform.id] ? ` · ${results[platform.id]}` : ''}
                  </Text>
                </View>
              )
            })}
          </View>

          <Text style={[a.font_bold, a.text_2xl]}>Alternative links</Text>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            Unconfirmed links for apps that need a device check.
          </Text>
          <View style={[a.gap_sm]}>
            {ALTERNATIVES.map(alt => (
              <View
                key={alt.url}
                style={[a.flex_row, a.align_center, a.gap_md]}>
                <Button
                  label={`Open ${alt.label}`}
                  size="small"
                  color="secondary"
                  onPress={() => void openAlternative(alt.url)}>
                  <ButtonText>Open</ButtonText>
                </Button>
                <Text
                  style={[a.flex_1, a.text_sm, t.atoms.text_contrast_medium]}>
                  {alt.label}
                  {results[alt.url] ? ` · ${results[alt.url]}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}
