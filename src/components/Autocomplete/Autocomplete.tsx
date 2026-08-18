import {useCallback} from 'react'
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
      return <></>
  }
}

export function Autocomplete({
  inverted,
  sift,
  data,
  render = renderItem,
  onSelect,
  onDismiss,
  fullWidth = false,
}: {
  inverted?: boolean
  sift: UseSiftReturn
  data: AutocompleteItem[]
  render?: Parameters<typeof Sift<AutocompleteItem>>[0]['render']
  onSelect: (item: AutocompleteItem) => void
  onDismiss: () => void
  /**
   * Match the anchor's width instead of the default capped width. Use for
   * full-width anchors like the search bar; leave off for inline mention
   * inputs.
   */
  fullWidth?: boolean
}) {
  const t = useTheme()

  const updatePosition = useCallback(() => {
    void sift.updatePosition()
  }, [sift])

  useOnKeyboard('keyboardDidShow', updatePosition)
  useOnKeyboard('keyboardDidHide', updatePosition)

  const maxWidth = IS_WEB && !fullWidth ? {maxWidth: 300} : {}

  return (
    <Portal>
      <Sift
        inverted={inverted}
        sift={sift}
        data={data}
        onSelect={onSelect}
        onDismiss={onDismiss}
        outerStyle={[a.rounded_md, a.w_full, t.atoms.shadow_lg, maxWidth]}
        innerStyle={[
          a.overflow_hidden,
          a.rounded_md,
          a.border,
          t.atoms.border_contrast_low,
          t.atoms.bg,
          a.w_full,
          maxWidth,
        ]}
        render={render}
      />
    </Portal>
  )
}
