import {useEffect} from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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

export function PostLanguageSelect({
  currentLanguages: currentLanguagesProp,
  onSelectLanguage,
  nudgeCount = 0,
}: {
  currentLanguages?: string[]
  onSelectLanguage?: (language: string) => void
  /**
   * Incremented by the parent when language detection was ambiguous. Each
   * increment flashes a transient hint on the button, then fades. The
   * initial `0` on mount is intentionally ignored.
   */
  nudgeCount?: number
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
        <LanguageBtn
          onPress={languageDialogControl.open}
          nudgeCount={nudgeCount}
        />
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
              nudgeCount={nudgeCount}
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

const NUDGE_FADE_MS = 150
const NUDGE_HOLD_MS = 1700

function LanguageBtn({
  currentLanguages: currentLanguagesProp,
  nudgeCount = 0,
  ...props
}: Omit<ButtonProps, 'label' | 'children'> & {
  currentLanguages?: string[]
  nudgeCount?: number
}) {
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()
  const t = useTheme()

  const postLanguagesPref = toPostLanguages(langPrefs.postLanguage)
  const currentLanguages = currentLanguagesProp ?? postLanguagesPref

  /*
   * Stays at 0 when idle; each nudge runs fade-in → hold → fade-out as a
   * single reanimated sequence. Reassigning `value` cancels any prior
   * sequence, so rapid re-nudges cleanly restart the flash.
   */
  const nudgeOpacity = useSharedValue(0)
  useEffect(() => {
    if (nudgeCount === 0) return
    nudgeOpacity.value = withSequence(
      withTiming(1, {duration: NUDGE_FADE_MS}),
      withDelay(NUDGE_HOLD_MS, withTiming(0, {duration: NUDGE_FADE_MS})),
    )
  }, [nudgeCount, nudgeOpacity])
  const nudgeStyle = useAnimatedStyle(() => ({
    opacity: nudgeOpacity.value,
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
      style={[a.mr_xs]}
      {...props}>
      {({pressed, hovered}) => {
        const color =
          pressed || hovered ? t.palette.primary_300 : t.palette.primary_500
        const label =
          currentLanguages.length > 0 ? (
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
          )
        return (
          <>
            {label}
            <Animated.View
              pointerEvents="none"
              style={[a.absolute, {top: 3, right: 1}, nudgeStyle]}>
              <Text emoji style={[a.text_lg]}>
                🤔
              </Text>
            </Animated.View>
          </>
        )
      }}
    </Button>
  )
}
