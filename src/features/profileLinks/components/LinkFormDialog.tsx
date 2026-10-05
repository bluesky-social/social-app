import {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {getLinkMeta} from '#/lib/link-meta/link-meta'
import {atoms as a, tokens, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/TimesLarge'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_LIQUID_GLASS} from '#/env'
import {useSupportPalette} from '../palette'
import {
  getLinkHost,
  normalizeProfileLinkUrl,
  validateLinkInput,
} from '../providers'
import {MAX_TITLE_LENGTH, type ProfileLink} from '../types'
import {ProviderLogo} from './ProviderLogo'

/** The counter stays out of the way until the title is getting long. */
const SHOW_COUNTER_FROM = 20

/**
 * Turns a page title into something pill-sized: the part before a separator
 * like " | " or " - " (sites append a tagline or their name), cut back to the
 * last whole word that fits.
 */
function suggestTitle(pageTitle: string | undefined): string {
  const first =
    (pageTitle ?? '').split(/\s+[|\-\u2013\u2014\u00b7]\s+|:\s+/)[0] ?? ''
  const trimmed = first.trim()
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed
  const cut = trimmed.slice(0, MAX_TITLE_LENGTH)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()
}

/** Shows the saved link the way people type it, without the scheme. */
function formatUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
}

/**
 * Adds, edits or removes a profile link. Pass the link being edited, or null
 * to add a new one. The caller decides what saving means.
 */
export function LinkFormDialog({
  control,
  link,
  existingUrls,
  onSave,
  onRemove,
}: {
  control: Dialog.DialogControlProps
  link: ProfileLink | null
  /** Other links on the profile, to catch duplicates. */
  existingUrls: string[]
  /** Runs after the sheet closes. */
  onSave: (link: ProfileLink) => void
  /** Runs after the sheet closes. */
  onRemove?: () => void
}) {
  return (
    <Dialog.Outer
      control={control}
      webOptions={{alignCenter: true}}
      /*
       * The link field autofocuses, and a sheet that can grow to full height
       * jumps to it when the keyboard opens, scrolling the title out of view.
       * Keeping the sheet at content height lifts it above the keyboard.
       */
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <LinkFormInner
        link={link}
        existingUrls={existingUrls}
        onSave={onSave}
        onRemove={onRemove}
      />
    </Dialog.Outer>
  )
}

function LinkFormInner({
  link,
  existingUrls,
  onSave,
  onRemove,
}: {
  link: ProfileLink | null
  existingUrls: string[]
  onSave: (link: ProfileLink) => void
  onRemove?: () => void
}) {
  const control = Dialog.useDialogContext()
  const {t: l} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const palette = useSupportPalette()

  const isEditing = !!link
  const startingInput = link ? formatUrl(link.url) : ''
  const [input, setInput] = useState(startingInput)
  const [touched, setTouched] = useState(false)
  const [title, setTitle] = useState(link?.title ?? '')
  /*
   * Before saving a new destination we ask the link preview service whether
   * the page exists. Some sites block scrapers, so a failed check is a
   * warning: pressing Save again saves anyway.
   */
  const [reachability, setReachability] = useState<
    'unchecked' | 'checking' | 'reachable' | 'unreachable'
  >('unchecked')
  /*
   * "ko-fi" is invalid until the ".com" lands, so errors only show once Save
   * is pressed, not on every keystroke.
   */
  const [error, setError] = useState<
    'invalid' | 'blocked' | 'duplicate' | undefined
  >()

  const validation = validateLinkInput(input)
  const provider = validation.provider
  // untouched input keeps the saved link exactly as it was
  const targetUrl =
    link && input.trim() === startingInput ? link.url : validation.url

  /*
   * Suggest a title from the page once the link parses. Only a blank title,
   * or one we filled in earlier, is replaced; anything typed stays. Support
   * links skip this, so they read "Support on <provider>".
   */
  const autoTitle = useRef('')
  useEffect(() => {
    if (!targetUrl || provider || validation.isBlocked) return
    let cancelled = false
    void getLinkMeta(targetUrl, 8e3).then(meta => {
      if (cancelled || meta.error) return
      setReachability('reachable')
      const suggestion = suggestTitle(meta.title)
      if (!suggestion) return
      const previousAuto = autoTitle.current
      autoTitle.current = suggestion
      setTitle(prev =>
        prev.trim() && prev !== previousAuto ? prev : suggestion,
      )
    })
    return () => {
      cancelled = true
    }
  }, [targetUrl, provider, validation.isBlocked])

  const nextTitle = title.trim() || undefined
  const isUnchanged =
    isEditing && targetUrl === link.url && nextTitle === link.title
  const canSave =
    !validation.isEmpty && !isUnchanged && reachability !== 'checking'

  const save = async () => {
    if (!canSave) return
    if (!targetUrl) {
      setError('invalid')
      return
    }
    if (validation.isBlocked) {
      setError('blocked')
      ax.metric('profile:links:rejected', {
        reason: 'blocked',
        domain: getLinkHost(targetUrl),
      })
      return
    }
    const normalized = normalizeProfileLinkUrl(targetUrl)
    const isDuplicate = existingUrls.some(
      url => normalizeProfileLinkUrl(url) === normalized,
    )
    if (isDuplicate) {
      setError('duplicate')
      return
    }
    // a saved link has proven itself; only check new destinations
    if (targetUrl !== link?.url && reachability === 'unchecked') {
      setReachability('checking')
      const meta = await getLinkMeta(targetUrl, 8e3)
      if (meta.error) {
        setReachability('unreachable')
        return
      }
    }
    const saved: ProfileLink = nextTitle
      ? {url: targetUrl, title: nextTitle}
      : {url: targetUrl}
    control.close(() => onSave(saved))
  }

  const errorText =
    error === 'invalid'
      ? l`That doesn’t look like a link. Try something like yoursite.com.`
      : error === 'blocked'
        ? l`Links to this site can’t be added right now.`
        : error === 'duplicate'
          ? l`You’ve already added this link.`
          : reachability === 'unreachable'
            ? l`We couldn’t reach this link. Check it, or save anyway.`
            : undefined

  // the close button sits as far from the top as the content is from the sides
  const closeInset = IS_LIQUID_GLASS ? tokens.space._2xl : tokens.space.xl

  return (
    <Dialog.ScrollableInner
      style={web({maxWidth: 480})}
      label={isEditing ? l`Edit link` : l`Add a link`}>
      <Button
        label={l`Cancel`}
        size="small"
        shape="round"
        color="secondary"
        onPress={() => control.close()}
        style={[a.absolute, a.z_10, {top: closeInset, right: closeInset}]}>
        <ButtonIcon icon={XIcon} />
      </Button>
      <View style={[a.gap_2xl, a.mt_sm]}>
        <View style={[a.gap_sm]}>
          <Text
            style={[
              a.text_2xl,
              a.font_bold,
              a.leading_tight,
              // clear of the close button
              {paddingRight: 48},
            ]}>
            {isEditing ? <Trans>Edit link</Trans> : <Trans>Add a link</Trans>}
          </Text>
          <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
            <Trans>Links show as buttons under your bio.</Trans>
          </Text>
        </View>

        <View style={[a.gap_lg]}>
          <View>
            <TextField.LabelText>
              <Trans>Link</Trans>
            </TextField.LabelText>
            <TextField.Root isInvalid={!!errorText}>
              <TextField.Icon icon={ChainLinkIcon} />
              <Dialog.Input
                testID="profileLinkUrlInput"
                label={l`Link`}
                placeholder="yoursite.com"
                defaultValue={startingInput}
                onChangeText={value => {
                  setInput(value)
                  setTouched(true)
                  setReachability('unchecked')
                  setError(undefined)
                  /*
                   * "patreon.com" isn't a support link yet, so it may have
                   * picked up the homepage's title. Drop that once it
                   * becomes one, so the pill reads "Support on Patreon".
                   */
                  if (autoTitle.current && validateLinkInput(value).provider) {
                    const previousAuto = autoTitle.current
                    autoTitle.current = ''
                    setTitle(prev => (prev === previousAuto ? '' : prev))
                  }
                }}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="url"
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={() => void save()}
              />
            </TextField.Root>
            {errorText ? (
              <Text
                style={[a.mt_xs, a.text_sm, {color: t.palette.negative_500}]}>
                {errorText}
              </Text>
            ) : touched && provider ? (
              <View style={[a.flex_row, a.align_start, a.gap_xs, a.mt_xs]}>
                <ProviderLogo
                  provider={provider}
                  size="xs"
                  // sits on the first line of text when the note wraps
                  style={{color: palette.tintText, marginTop: 2}}
                />
                <Text
                  style={[
                    a.flex_1,
                    a.text_sm,
                    a.leading_snug,
                    {color: palette.tintText},
                  ]}>
                  <Trans>
                    {provider.name} is a recognized support link. It gets the
                    green Support button.
                  </Trans>
                </Text>
              </View>
            ) : null}
          </View>

          <View>
            <TextField.LabelText>
              <Trans>Title (optional)</Trans>
            </TextField.LabelText>
            <TextField.Root>
              <Dialog.Input
                testID="profileLinkTitleInput"
                label={l`Title`}
                placeholder={
                  provider ? l`Support on ${provider.name}` : l`e.g. Portfolio`
                }
                // controlled so the page's title can be dropped in
                value={title}
                onChangeText={setTitle}
                maxLength={MAX_TITLE_LENGTH}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={() => void save()}
              />
              {title.length >= SHOW_COUNTER_FROM ? (
                <TextField.SuffixText
                  label={l`${title.length} out of ${MAX_TITLE_LENGTH} characters`}
                  style={[
                    a.text_sm,
                    t.atoms.text_contrast_low,
                    {paddingRight: 0},
                  ]}>
                  {title.length}/{MAX_TITLE_LENGTH}
                </TextField.SuffixText>
              ) : null}
            </TextField.Root>
          </View>
        </View>

        <View style={[a.gap_sm]}>
          <Button
            testID="profileLinkSaveBtn"
            label={
              reachability === 'unreachable'
                ? l`Save anyway`
                : isEditing
                  ? l`Save changes`
                  : l`Add link`
            }
            onPress={() => void save()}
            disabled={!canSave}
            size="large"
            color="primary"
            style={[
              provider && {backgroundColor: palette.bg},
              !canSave && {opacity: 0.5},
            ]}
            hoverStyle={
              provider ? {backgroundColor: palette.bgHover} : undefined
            }>
            <ButtonText>
              {reachability === 'unreachable' ? (
                <Trans>Save anyway</Trans>
              ) : isEditing ? (
                <Trans>Save changes</Trans>
              ) : (
                <Trans>Add link</Trans>
              )}
            </ButtonText>
            {reachability === 'checking' && <ButtonIcon icon={Loader} />}
          </Button>
          {onRemove ? (
            <Button
              testID="profileLinkRemoveBtn"
              label={l`Remove link`}
              onPress={() => control.close(onRemove)}
              size="large"
              color="negative_subtle">
              <ButtonText>
                <Trans>Remove link</Trans>
              </ButtonText>
            </Button>
          ) : null}
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
