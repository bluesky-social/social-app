import React, {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'

export function GifSelectDialog({
  control,
  onClose,
}: {
  control: Dialog.DialogControlProps
  onClose: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const [search, setSearch] = useState('')

  const listHeader = useMemo(
    () => (
      <View style={[t.atoms.bg, a.mb_lg]}>
        <TextField.Root>
          <TextField.Icon icon={Search} />
          <TextField.Input
            label={_(msg`Search GIFs`)}
            placeholder={_(msg`Powered by GIPHY`)}
            value={search}
            onChangeText={setSearch}
          />
        </TextField.Root>
      </View>
    ),
    [search, _, t.atoms.bg],
  )

  const renderItem = useCallback(() => {
    return <View style={[{height: 50, width: 50, backgroundColor: 'red'}]} />
  }, [])

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{sheet: {snapPoints: ['100%']}}}
      onClose={onClose}>
      <Dialog.Handle />
      <Dialog.InnerFlatList
        data={['hello', 'world']}
        renderItem={renderItem}
        numColumns={2}
        ListHeaderComponent={listHeader}
        stickyHeaderIndices={[0]}
      />
    </Dialog.Outer>
  )
}
