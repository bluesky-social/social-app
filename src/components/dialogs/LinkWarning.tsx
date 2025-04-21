import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {shareUrl} from '#/lib/sharing'
import {isPossiblyAUrl, splitApexDomain} from '#/lib/strings/url-helpers'
import {isWeb} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {useGlobalDialogsControlContext} from './Context'

export function LinkWarningDialog() {
  const {linkWarningDialogControl} = useGlobalDialogsControlContext()

  if (isWeb) return null

  return (
    <Dialog.Outer
      control={linkWarningDialogControl.control}
      nativeOptions={{preventExpansion: true}}
      onClose={linkWarningDialogControl.clear}>
      <Dialog.Handle />
      <InAppBrowserConsentInner link={linkWarningDialogControl.value} />
    </Dialog.Outer>
  )
}

function InAppBrowserConsentInner({
  link,
}: {
  link?: {href: string; displayText: string; share?: boolean}
}) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const t = useTheme()
  const openLink = useOpenLink()

  const potentiallyMisleading = useMemo(
    () => link && isPossiblyAUrl(link.displayText),
    [link],
  )

  const onPressVisit = useCallback(() => {
    control.close(() => {
      if (!link) return
      if (link.share) {
        shareUrl(link.href)
      } else {
        openLink(link.href, undefined, true)
      }
    })
  }, [control, link, openLink])

  const onCancel = useCallback(() => {
    control.close()
  }, [control])

  return (
    <Dialog.ScrollableInner
      label={
        potentiallyMisleading
          ? _(msg`Potentially misleading link warning`)
          : _(msg`Leaving Bluesky`)
      }>
      <View style={[a.gap_2xl]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_heavy, a.text_2xl]}>
            {potentiallyMisleading ? (
              <Trans>Potentially misleading link</Trans>
            ) : (
              <Trans>Leaving Bluesky</Trans>
            )}
          </Text>
          <Text style={[t.atoms.text_contrast_high, a.text_md, a.leading_snug]}>
            <Trans>This link is taking you to the following website:</Trans>
          </Text>
          {link && <LinkBox href={link.href} />}
          {potentiallyMisleading && (
            <Text
              style={[t.atoms.text_contrast_high, a.text_md, a.leading_snug]}>
              <Trans>Make sure this is where you intend to go!</Trans>
            </Text>
          )}
        </View>
        <View style={[a.gap_sm]}>
          <Button
            label={_(msg`Visit site`)}
            accessibilityHint={_(msg`Opens link ${link?.href ?? ''}`)}
            onPress={onPressVisit}
            size="large"
            variant="solid"
            color={potentiallyMisleading ? 'secondary_inverted' : 'primary'}>
            <ButtonText>
              <Trans>Visit site</Trans>
            </ButtonText>
          </Button>
          <Button
            label={_(msg`Cancel`)}
            onPress={onCancel}
            size="large"
            variant="ghost"
            color="secondary">
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}

function LinkBox({href}: {href: string}) {
  const t = useTheme()
  const [scheme, hostname, rest] = useMemo(() => {
    try {
      const urlp = new URL(href)
      const [subdomain, apexdomain] = splitApexDomain(urlp.hostname)
      return [
        urlp.protocol + '//' + subdomain,
        apexdomain,
        urlp.pathname.replace(/\/$/, '') + urlp.search + urlp.hash,
      ]
    } catch {
      return ['', href, '']
    }
  }, [href])
  return (
    <View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_medium,
        a.px_md,
        {paddingVertical: 10},
        a.rounded_sm,
        a.border,
      ]}>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
        {scheme}
        <Text style={[a.text_md, a.leading_snug, t.atoms.text, a.font_bold]}>
          {hostname}
        </Text>
        {rest}
      </Text>
    </View>
  )
}
