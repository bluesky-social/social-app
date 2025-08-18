import {useCallback} from 'react'
import {Keyboard} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {LANG_DROPDOWN_HITSLOP} from '#/lib/constants'
import {isNative} from '#/platform/detection'
import {toPostLanguages, useLanguagePrefs} from '#/state/preferences/languages'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PostLanguagesSettingsDialog} from '#/components/dialogs/PostLanguagesSettingsDialog'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Text} from '#/components/Typography'
import {codeToLanguageName} from '../../../../locale/helpers'

export function SelectLangBtn() {
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()
  const t = useTheme()
  const control = Dialog.useDialogControl()

  const onPressMore = useCallback(async () => {
    if (isNative) {
      if (Keyboard.isVisible()) {
        Keyboard.dismiss()
      }
    }
    control.open()
  }, [control])

  const postLanguagesPref = toPostLanguages(langPrefs.postLanguage)

  return (
    <>
      <Button
        testID="selectLangBtn"
        onPress={onPressMore}
        variant="ghost"
        size="small"
        hitSlop={LANG_DROPDOWN_HITSLOP}
        label={_(msg`Language selection`)}
        accessibilityLabel={_(msg`Language selection`)}
        accessibilityHint={_(msg`Opens language settings`)}
        style={[a.mx_md]}>
        {postLanguagesPref.length > 0 ? (
          <Text
            style={[
              {color: t.palette.primary_500},
              a.font_bold,
              a.text_sm,
              {maxWidth: 100},
            ]}
            numberOfLines={1}>
            {postLanguagesPref
              .map(lang => codeToLanguageName(lang, langPrefs.appLanguage))
              .join(', ')}
          </Text>
        ) : (
          <GlobeIcon size="xs" style={[{color: t.palette.primary_500}]} />
        )}
      </Button>

      <Dialog.Outer control={control}>
        <Dialog.ScrollableInner
          accessibilityLabelledBy="dialog-title"
          accessibilityDescribedBy="dialog-description">
          <PostLanguagesSettingsDialog onClose={control.close} />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
