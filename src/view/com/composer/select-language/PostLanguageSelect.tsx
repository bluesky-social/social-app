import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

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
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {PostLanguageSelectDialog} from './PostLanguageSelectDialog'

export function PostLanguageSelect() {
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const languageDialogControl = Dialog.useDialogControl()

  const dedupedHistory = Array.from(
    new Set([...langPrefs.postLanguageHistory, langPrefs.postLanguage]),
  )

  if (
    dedupedHistory.length === 1 &&
    dedupedHistory[0] === langPrefs.postLanguage
  ) {
    return (
      <>
        <LanguageBtn onPress={languageDialogControl.open} />
        <PostLanguageSelectDialog control={languageDialogControl} />
      </>
    )
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Select post language`)}>
          {({props}) => <LanguageBtn {...props} />}
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
                  onPress={() => setLangPrefs.setPostLanguage(historyItem)}>
                  <Menu.ItemText>{langName}</Menu.ItemText>
                  <Menu.ItemRadio
                    selected={historyItem === langPrefs.postLanguage}
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

      <PostLanguageSelectDialog control={languageDialogControl} />
    </>
  )
}

function LanguageBtn(props: Omit<ButtonProps, 'label' | 'children'>) {
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()
  const t = useTheme()

  const postLanguagesPref = toPostLanguages(langPrefs.postLanguage)

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
        if (postLanguagesPref.length > 0) {
          return (
            <Text
              style={[
                {color},
                a.font_bold,
                a.text_sm,
                a.leading_snug,
                {maxWidth: 100},
              ]}
              numberOfLines={1}>
              {postLanguagesPref
                .map(lang => codeToLanguageName(lang, langPrefs.appLanguage))
                .join(', ')}
            </Text>
          )
        } else {
          return <GlobeIcon size="xs" style={{color}} />
        }
      }}
    </Button>
  )
}
