import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {
  ReportDialog,
  useReportDialogControl,
} from '#/components/moderation/ReportDialog'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {useSupportPalette} from '../palette'
import {formatLinkUrl, getLinkHost, getSupportProvider} from '../providers'
import {useProfileLinksEnabled, useProfileViewLinks} from '../state'
import {type ProfileLink} from '../types'
import {LinkFavicon, linkFaviconUrl} from './LinkFavicon'
import {ProviderLogo} from './ProviderLogo'

const ICON_SIZE = 32

/**
 * The links on someone else's profile that can be reported: those shown to
 * this viewer and backed by a link record.
 */
export function useReportableProfileLinks(
  profile: app.bsky.actor.defs.ProfileViewDetailed,
): ProfileLink[] {
  const enabled = useProfileLinksEnabled()
  const links = useProfileViewLinks(profile)
  if (!enabled) return []
  return links.filter(link => link.uri && link.cid)
}

/**
 * "Report a link" from the profile menu: pick one of the profile's links, then
 * report its link record. Works where long-pressing a link isn't available,
 * like on web.
 */
export function ReportLinkDialog({
  control,
  links,
}: {
  control: Dialog.DialogControlProps
  links: ProfileLink[]
}) {
  const reportControl = useReportDialogControl()
  const [selected, setSelected] = useState<ProfileLink | null>(null)
  const reported = selected ?? links[0]

  return (
    <>
      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <ReportLinkPicker
          links={links}
          onSelect={link => {
            control.close(() => {
              setSelected(link)
              reportControl.open()
            })
          }}
        />
      </Dialog.Outer>
      {reported?.uri && reported.cid ? (
        <ReportDialog
          control={reportControl}
          // the link was read off a profile view, so these are well-formed
          subject={{
            $type: 'app.bsky.actor.defs#profileLinkView',
            uri: reported.uri as app.bsky.actor.defs.ProfileLinkView['uri'],
            cid: reported.cid,
            url: reported.url as app.bsky.actor.defs.ProfileLinkView['url'],
          }}
        />
      ) : null}
    </>
  )
}

function ReportLinkPicker({
  links,
  onSelect,
}: {
  links: ProfileLink[]
  onSelect: (link: ProfileLink) => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()

  return (
    <Dialog.ScrollableInner
      style={web({maxWidth: 480})}
      label={l`Report a link`}>
      <View style={[a.gap_sm, a.pb_md]}>
        <Text style={[a.text_2xl, a.font_bold, a.leading_tight]}>
          <Trans>Report a link</Trans>
        </Text>
        <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>Which link do you want to report?</Trans>
        </Text>
      </View>
      <View>
        {links.map(link => {
          const label = linkRowLabel(link)
          return (
            <Button
              key={link.url}
              testID="profileLinkReportPickerItem"
              label={l`Report ${label}`}
              onPress={() => onSelect(link)}>
              {({hovered, pressed}) => (
                <View
                  style={[
                    a.flex_1,
                    a.flex_row,
                    a.align_center,
                    a.gap_md,
                    a.py_md,
                    a.border_b,
                    t.atoms.border_contrast_low,
                  ]}>
                  <LinkRowIcon link={link} />
                  <View style={[a.flex_1, a.gap_2xs]}>
                    <Text
                      emoji
                      numberOfLines={1}
                      style={[a.text_md, a.font_semi_bold, a.leading_snug]}>
                      {label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        a.text_sm,
                        a.leading_snug,
                        t.atoms.text_contrast_medium,
                      ]}>
                      {formatLinkUrl(link.url)}
                    </Text>
                  </View>
                  <ChevronRightIcon
                    size="md"
                    style={
                      hovered || pressed
                        ? t.atoms.text
                        : t.atoms.text_contrast_low
                    }
                  />
                </View>
              )}
            </Button>
          )
        })}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

/** The owner's title, the support platform's name, or the bare domain. */
function linkRowLabel(link: ProfileLink): string {
  return (
    link.title || getSupportProvider(link.url)?.name || getLinkHost(link.url)
  )
}

function LinkRowIcon({link}: {link: ProfileLink}) {
  const t = useTheme()
  const palette = useSupportPalette()
  const provider = getSupportProvider(link.url)
  const globe = <GlobeIcon size="lg" style={t.atoms.text_contrast_medium} />

  if (provider) {
    return (
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_full,
          a.border,
          {
            width: ICON_SIZE,
            height: ICON_SIZE,
            backgroundColor: palette.tintBg,
            borderColor: palette.tintBorder,
          },
        ]}>
        <ProviderLogo
          provider={provider}
          size="md"
          style={{color: palette.tintText}}
        />
      </View>
    )
  }
  const faviconUrl = linkFaviconUrl(link, undefined)
  return (
    <View
      style={[
        a.align_center,
        a.justify_center,
        {width: ICON_SIZE, height: ICON_SIZE},
      ]}>
      {faviconUrl ? (
        <LinkFavicon uri={faviconUrl} size={24} fallback={globe} />
      ) : (
        globe
      )}
    </View>
  )
}
