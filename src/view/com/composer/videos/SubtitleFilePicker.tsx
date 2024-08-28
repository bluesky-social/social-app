import React, {useRef, useState} from 'react'
import {View} from 'react-native'
import RNPickerSelect from 'react-native-picker-select'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs} from '#/state/preferences'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {CC_Stroke2_Corner0_Rounded as CCIcon} from '#/components/icons/CC'
import {PageText_Stroke2_Corner0_Rounded as PageTextIcon} from '#/components/icons/PageText'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function SubtitleFilePicker({
  pending,
}: {
  onSelectFile: (file: File) => void
  pending: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const ref = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const {primaryLanguage} = useLanguagePrefs()
  const [language, setLanguage] = useState(primaryLanguage)

  const handleClick = () => {
    ref.current?.click()
  }

  const handlePick = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = evt.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === 'text/vtt') {
        setFile(selectedFile)
      } else {
        Toast.show(_(msg`Only WebVTT (.vtt) files are supported`))
      }
    }
  }

  return (
    <View style={a.gap_lg}>
      <input
        type="file"
        accept=".vtt"
        ref={ref}
        style={a.hidden}
        onChange={handlePick}
      />
      <View style={a.flex_row}>
        <Button
          onPress={handleClick}
          label={_('Select subtitle file (.vtt)')}
          size="medium"
          color="primary"
          variant="solid"
          disabled={pending}>
          <ButtonIcon icon={CCIcon} />
          <ButtonText>
            <Trans>Select subtitle file (.vtt)</Trans>
          </ButtonText>
          {pending && <Loader />}
        </Button>
      </View>
      {file && (
        <View style={[a.flex_row, a.gap_md, a.align_center]}>
          <PageTextIcon style={t.atoms.text} size="sm" />
          <Text>{file.name}</Text>
          <RNPickerSelect
            placeholder="Select language"
            value={language}
            onValueChange={setLanguage}
            items={LANGUAGES.map(lang => ({
              label: `${lang.name} (${lang.code2 || lang.code3})`,
              value: lang.code2 || lang.code3,
            }))}
            style={{viewContainer: {maxWidth: 200}}}
          />
        </View>
      )}
    </View>
  )
}
