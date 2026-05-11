import {useCallback} from 'react'
import {View} from 'react-native'
import {Sift, type UseSiftReturn} from '@bsky.app/sift'

import {atoms as a, useTheme} from '#/alf'
import {type AutocompleteItem} from '#/components/Autocomplete/types'
import {useOnKeyboard} from '#/components/hooks/useOnKeyboard'
import {Portal} from '#/components/Portal'
import {IS_WEB} from '#/env'
import {AutocompleteItemEmoji} from './AutocompleteItemEmoji'
import {AutocompleteItemProfile} from './AutocompleteItemProfile'
import {AutocompleteItemSearch} from './AutocompleteItemSearch'

function renderItem(
  item: Parameters<Parameters<typeof Sift<AutocompleteItem>>[0]['render']>[0],
) {
  switch (item.item.type) {
    case 'profile':
      return <AutocompleteItemProfile {...item} />
    case 'emoji':
      return <AutocompleteItemEmoji {...item} />
    case 'search':
      return <AutocompleteItemSearch {...item} />
    default:
      return <View />
  }
}

export function Autocomplete({
  inverted,
  sift,
  data,
  render = renderItem,
  onSelect,
  onDismiss,
}: {
  inverted?: boolean
  sift: UseSiftReturn
  data: AutocompleteItem[]
  render?: Parameters<typeof Sift<AutocompleteItem>>[0]['render']
  onSelect: (item: AutocompleteItem) => void
  onDismiss: () => void
}) {
  const t = useTheme()

  const updatePosition = useCallback(() => {
    sift.updatePosition()
  }, [sift])

  useOnKeyboard('keyboardDidShow', updatePosition)
  useOnKeyboard('keyboardDidHide', updatePosition)

  return (
    <Portal>
      <Sift
        inverted={inverted}
        sift={sift}
        data={data}
        onSelect={onSelect}
        onDismiss={onDismiss}
        outerStyle={[
          a.rounded_md,
          a.w_full,
          t.atoms.shadow_lg,
          IS_WEB
            ? {
                maxWidth: 300,
              }
            : {},
        ]}
        innerStyle={[
          a.overflow_hidden,
          a.rounded_md,
          a.border,
          t.atoms.border_contrast_low,
          t.atoms.bg,
          a.w_full,
          IS_WEB
            ? {
                maxWidth: 300,
              }
            : {},
        ]}
        render={render}
      />
    </Portal>
  )
}
