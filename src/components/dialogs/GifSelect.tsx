import React, {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'

export function GifSelectDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')

  const listHeader = useMemo(
    () => (
      <TextField.Root>
        <TextField.Icon icon={Search} />
        <TextField.Input
          label={_(msg`Search GIFs`)}
          placeholder={_(msg`Powered by GIPHY`)}
          value={search}
          onChangeText={setSearch}
        />
      </TextField.Root>
    ),
    [search, _],
  )

  const listFooter = useMemo(
    () => <View style={{height: insets.bottom + a.pt_5xl.paddingTop}} />,
    [insets.bottom],
  )
  const renderItem = useCallback(() => {
    return <View style={{height: 50, width: 50, backgroundColor: 'red'}} />
  }, [])

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.InnerFlatList
        data={['hello', 'world']}
        renderItem={renderItem}
        numColumns={2}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        keyboardShouldPersistTaps="handled"
        style={[
          a.flex_1,
          a.p_xl,
          a.h_full,
          {
            paddingTop: 40,
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
          },
        ]}
        contentContainerStyle={isNative ? a.pb_4xl : undefined}
      />
    </Dialog.Outer>
  )
}
