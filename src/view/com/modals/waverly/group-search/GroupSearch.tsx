import React, {useCallback, useMemo} from 'react'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {StyleSheet, TextInput, View} from 'react-native'
import {s} from 'lib/styles'
import {ButtonGroup, TextButton} from '../../../w2/word-dj/top-bar/ButtonGroup'
import {Text} from 'view/com/util/text/Text'
import {useTheme} from 'lib/ThemeContext'
import {GroupSearchResults} from './GroupSearchResults'
import {GroupSearchUIModel} from 'state/models/w2/GroupSearchUIModel'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {GroupSearchItem} from 'w2-api/waverly_sdk'

const HEADER_TITLE = 'Post to'

export const snapPoints = ['fullscreen']

export const Component = observer(function Component({
  onSelect,
}: {
  onSelect: (g: GroupSearchItem) => void
}) {
  const store = useStores()
  const pal = usePalette('default')
  const typography = useTheme().typography
  const insets = useSafeAreaInsets()

  const searchUIModel = useMemo<GroupSearchUIModel>(
    () => new GroupSearchUIModel(store),
    [store],
  )

  const onClose = useCallback(() => {
    store.shell.closeModal()
  }, [store.shell])

  const onChangeQuery = useCallback(
    (text: string) => {
      if (text.length > 0) {
        searchUIModel.setActive(true)
        searchUIModel.setQuery(text)
      } else {
        searchUIModel.setActive(false)
      }
    },
    [searchUIModel],
  )

  const onChangeGroup = useCallback(
    (g: GroupSearchItem) => {
      onSelect(g)
      store.shell.closeModal()
    },
    [onSelect, store.shell],
  )

  return (
    <View style={[s.flex1, {paddingBottom: insets.bottom}]}>
      <View style={[styles.container, pal.view]}>
        <ButtonGroup location="flex-start">
          <TextButton text="Close" onPress={onClose} />
        </ButtonGroup>
        <Text type={'lg-bold'} style={[pal.text, s.op100]}>
          {HEADER_TITLE}
        </Text>
        <ButtonGroup location="flex-end">
          <View style={s.op0} />
        </ButtonGroup>
      </View>
      <View style={(s.flex1, {padding: 15})}>
        <View style={[s.w100pct, s.p10, styles.searchInputContainer]}>
          <TextInput
            accessibilityRole="button"
            placeholder="Search Waves"
            style={[pal.text, typography.lg]}
            placeholderTextColor={pal.textLight.color}
            onChangeText={onChangeQuery}
          />
        </View>
        <GroupSearchResults
          model={searchUIModel}
          onChangeGroup={onChangeGroup}
        />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  searchInputContainer: {
    height: 44,
    backgroundColor: 'rgba(234, 234, 234, 1)',
    borderRadius: 8,
    justifyContent: 'center',
  },
})
