import {useEffect} from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {LANG_DROPDOWN_HITSLOP} from '#/lib/constants'
import {codeToLanguageName} from '#/locale/helpers'
import {
  toPostLanguages,
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {atoms as a, useTheme} from '#/alf'
import {Button, type ButtonProps} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {LanguageSelectDialog} from '#/components/dialogs/LanguageSelectDialog'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function PostLanguageSelect({
  currentLanguages: currentLanguagesProp,
  onSelectLanguage,
  nudgeAt = 0,
}: {
  currentLanguages?: string[]
  onSelectLanguage?: (language: string) => void
  /**
   * Timestamp (ms) of the last honored language-detection nudge. Each
   * time this changes, the button flashes a transient hint and fades.
   * The parent rate-limits updates, so successive detector firings inside
   * the cooldown won't re-flash. The initial `0` on mount is intentionally
   * ignored.
   */
  nudgeAt?: number
}) {
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const languageDialogControl = Dialog.useDialogControl()

  const dedupedHistory = Array.from(
    new Set([...langPrefs.postLanguageHistory, langPrefs.postLanguage]),
  )

  const currentLanguages =
    currentLanguagesProp ?? toPostLanguages(langPrefs.postLanguage)

  const onSelectLanguages = (languages: string[]) => {
    let langsString = languages.join(',')
    if (!langsString) {
      langsString = langPrefs.primaryLanguage
    }
    setLangPrefs.setPostLanguage(langsString)
    onSelectLanguage?.(langsString)
  }

  if (
    dedupedHistory.length === 1 &&
    dedupedHistory[0] === langPrefs.postLanguage
  ) {
    return (
      <>
        <LanguageBtn onPress={languageDialogControl.open} nudgeAt={nudgeAt} />
        <LanguageSelectDialog
          titleText={<Trans>Choose post languages</Trans>}
          subtitleText={
            <Trans>Select up to 3 languages used in this post</Trans>
          }
          control={languageDialogControl}
          currentLanguages={currentLanguages}
          onSelectLanguages={onSelectLanguages}
          maxLanguages={3}
        />
      </>
    )
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Select post language`)}>
          {({props}) => (
            <LanguageBtn
              currentLanguages={currentLanguages}
              nudgeAt={nudgeAt}
              {...props}
            />
          )}
        </Menu.Trigger>
        <Menu.Outer>
          <Menu.Group>
            {dedupedHistory.map(historyItem => {
              const langCodes = historyItem.split(',')
              const langName = langCodes
                .map(code => codeToLanguageName(code, langPrefs.appLanguage))
                .join(' + ')
              return (
                <Menu.Item
                  key={historyItem}
                  label={_(msg`Select ${langName}`)}
                  onPress={() => {
                    setLangPrefs.setPostLanguage(historyItem)
                    onSelectLanguage?.(historyItem)
                  }}>
                  <Menu.ItemText>{langName}</Menu.ItemText>
                  <Menu.ItemRadio
                    selected={currentLanguages.includes(historyItem)}
                  />
                </Menu.Item>
              )
            })}
          </Menu.Group>
          <Menu.Divider />
          <Menu.Item
            label={_(msg`More languages...`)}
            onPress={languageDialogControl.open}>
            <Menu.ItemText>
              <Trans>More languages...</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={ChevronRightIcon} />
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>

      <LanguageSelectDialog
        titleText={<Trans>Choose post languages</Trans>}
        subtitleText={<Trans>Select up to 3 languages used in this post</Trans>}
        control={languageDialogControl}
        currentLanguages={currentLanguages}
        onSelectLanguages={onSelectLanguages}
        maxLanguages={3}
      />
    </>
  )
}

const PULSE_FADE_IN_MS = 300
const PULSE_FADE_OUT_MS = 500

function LanguageBtn({
  currentLanguages: currentLanguagesProp,
  nudgeAt = 0,
  ...props
}: Omit<ButtonProps, 'label' | 'children'> & {
  currentLanguages?: string[]
  nudgeAt?: number
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()

  const postLanguagesPref = toPostLanguages(langPrefs.postLanguage)
  const currentLanguages = currentLanguagesProp ?? postLanguagesPref

  /*
   * Stays at 0 when idle; each nudge runs two pulses with a faster
   * fade-in and slower fade-out, ease-in-out throughout. Reassigning
   * `value` cancels any prior sequence, so rapid re-nudges cleanly
   * restart.
   */
  const nudgePulse = useSharedValue(0)
  useEffect(() => {
    if (nudgeAt === 0) return
    const easing = Easing.inOut(Easing.quad)
    const fadeIn = {duration: PULSE_FADE_IN_MS, easing}
    const fadeOut = {duration: PULSE_FADE_OUT_MS, easing}
    nudgePulse.value = withSequence(
      withTiming(1, fadeIn),
      withTiming(0, fadeOut),
      withTiming(1, fadeIn),
      withTiming(0, fadeOut),
    )
  }, [nudgeAt, nudgePulse])
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: nudgePulse.value,
  }))

  return (
    <Button
      testID="selectLangBtn"
      size="small"
      hitSlop={LANG_DROPDOWN_HITSLOP}
      label={_(
        msg({
          message: `Post language selection`,
          comment: `Accessibility label for button that opens dialog to choose post language settings`,
        }),
      )}
      accessibilityHint={_(msg`Opens post language settings`)}
      style={[a.mr_xs, a.overflow_hidden]}
      {...props}
      onPress={e => {
        props.onPress?.(e)
        ax.metric('composer:language:langSelectorPressed', {
          wasNudged: nudgeAt > 0,
        })
      }}>
      {({pressed, hovered}) => {
        const color =
          pressed || hovered ? t.palette.primary_300 : t.palette.primary_500
        return (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                a.absolute,
                {
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  backgroundColor: t.atoms.bg_contrast_50.backgroundColor,
                },
                pulseStyle,
              ]}
            />
            {currentLanguages.length > 0 ? (
              <Text
                style={[
                  {color},
                  a.font_semi_bold,
                  a.text_sm,
                  a.leading_snug,
                  {maxWidth: 100},
                ]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.5}>
                {currentLanguages
                  .map(lang => codeToLanguageName(lang, langPrefs.appLanguage))
                  .join(', ')}
              </Text>
            ) : (
              <GlobeIcon size="xs" style={{color}} />
            )}
          </>
        )
      }}
    </Button>
  )
}
