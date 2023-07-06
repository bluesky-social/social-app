import React, {useCallback, useMemo} from 'react'
import {StyleSheet, Keyboard} from 'react-native'
import {observer} from 'mobx-react-lite'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from 'view/com/util/text/Text'
import {
  DropdownButton,
  DropdownItem,
  DropdownItemButton,
} from 'view/com/util/forms/DropdownButton'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {isNative} from 'platform/detection'
import {codeToLanguageName} from '../../../../locale/helpers'
import {deviceLocales} from 'platform/detection'

export const SelectLangBtn = observer(function SelectLangBtn() {
  const pal = usePalette('default')
  const store = useStores()

  const onPressMore = useCallback(async () => {
    if (isNative) {
      if (Keyboard.isVisible()) {
        Keyboard.dismiss()
      }
    }
    store.shell.openModal({name: 'post-languages-settings'})
  }, [store])

  const postLanguagesPref = store.preferences.postLanguages
  const items: DropdownItem[] = useMemo(() => {
    let arr: DropdownItemButton[] = []

    const add = (langCode: string) => {
      const langName = codeToLanguageName(langCode)
      if (arr.find((item: DropdownItemButton) => item.label === langName)) {
        return
      }
      arr.push({
        icon: store.preferences.hasPostLanguage(langCode)
          ? ['fas', 'circle-check']
          : ['far', 'circle'],
        label: langName,
        onPress() {
          store.preferences.setPostLanguage(langCode)
        },
      })
    }

    for (const lang of postLanguagesPref) {
      add(lang)
    }
    for (const lang of deviceLocales) {
      add(lang)
    }
    add('en') // english
    add('ja') // japanese
    add('pt') // portugese
    add('de') // german

    return [
      {heading: true, label: 'Post language'},
      ...arr.slice(0, 6),
      {sep: true},
      {
        label: 'Other...',
        onPress: onPressMore,
      },
    ]
  }, [store.preferences, postLanguagesPref, onPressMore])

  return (
    <DropdownButton
      type="bare"
      testID="selectLangBtn"
      items={items}
      openUpwards
      style={styles.button}
      accessibilityLabel="Language selection"
      accessibilityHint="">
      {store.preferences.postLanguages.length > 0 ? (
        <Text type="lg-bold" style={[pal.link, styles.label]} numberOfLines={1}>
          {store.preferences.postLanguages
            .map(lang => codeToLanguageName(lang))
            .join(', ')}
        </Text>
      ) : (
        <FontAwesomeIcon
          icon="language"
          style={pal.link as FontAwesomeIconStyle}
          size={26}
        />
      )}
    </DropdownButton>
  )
})

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 15,
  },
  label: {
    maxWidth: 100,
  },
})
