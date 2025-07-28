import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { View } from 'react-native'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import type React from 'react'

import { ErrorScreen } from '#/view/com/util/error/ErrorScreen'
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary'
import { type ListMethods } from '#/view/com/util/List'
import { atoms as a, ios, native, useBreakpoints, useTheme, web } from '#/alf'
import { Button, ButtonIcon, ButtonText } from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import { TimesLarge_Stroke2_Corner0_Rounded as Times } from '#/components/icons/Times'
import { Text } from '../Typography'

const dummImages = [
  'https://images.unsplash.com/photo-1754653099086-3bddb9346d37?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754597302822-4b96f3442d3f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754764987594-2236e7736115?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754766621748-2a96cbf56a1f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754079132962-2f6c62f14d33?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1742201835839-33a959b5d97e?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754653099086-3bddb9346d37?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754597302822-4b96f3442d3f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754764987594-2236e7736115?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754766621748-2a96cbf56a1f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754079132962-2f6c62f14d33?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1742201835839-33a959b5d97e?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754653099086-3bddb9346d37?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754597302822-4b96f3442d3f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754764987594-2236e7736115?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754766621748-2a96cbf56a1f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754079132962-2f6c62f14d33?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1742201835839-33a959b5d97e?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754653099086-3bddb9346d37?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754597302822-4b96f3442d3f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754764987594-2236e7736115?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754766621748-2a96cbf56a1f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754079132962-2f6c62f14d33?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1742201835839-33a959b5d97e?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754653099086-3bddb9346d37?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754597302822-4b96f3442d3f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754764987594-2236e7736115?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754766621748-2a96cbf56a1f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1754079132962-2f6c62f14d33?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1742201835839-33a959b5d97e?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
]

export function AvatarSelectDialog({
  controlRef,
  onClose,
  onSelectAvatar: onSelectAvatarProp,
}: {
  controlRef: React.RefObject<{ open: () => void }>
  onClose?: () => void
  onSelectAvatar: (uri: string) => void
}) {
  const control = Dialog.useDialogControl()
  const { _ } = useLingui()

  useImperativeHandle(controlRef, () => ({
    open: () => control.open(),
  }))

  const onSelectAvatar = useCallback(
    (uri: string) => {
      control.close(() => onSelectAvatarProp(uri))
    },
    [control, onSelectAvatarProp],
  )

  const renderErrorBoundary = useCallback(
    (error: any) => <DialogError details={String(error)} />,
    [],
  )

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{
        bottomInset: 0,
        cornerRadius: 16,
        // use system corner radius on iOS
        ...ios({ cornerRadius: undefined }),
      }}>
      <ErrorBoundary renderError={renderErrorBoundary}>
        <AvatarList control={control} onSelectAvatar={onSelectAvatar} />
      </ErrorBoundary>
    </Dialog.Outer>
  )
}

function AvatarList({
  control,
  onSelectAvatar,
}: {
  control: Dialog.DialogControlProps
  onSelectAvatar: (uri: string) => void
}) {
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(-1)
  const { _ } = useLingui()
  const insets = useSafeAreaInsets()
  const t = useTheme()
  const listRef = useRef<ListMethods>(null)
  const { height } = useWindowDimensions()

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      return (
        <AvatarPreview
          uri={item}
          isSelected={index === selectedAvatarIndex}
          onPress={() => {
            setSelectedAvatarIndex(pevIndex => {
              if (index === pevIndex) {
                return -1
              }
              return index
            })
          }}
        />
      )
    },
    [selectedAvatarIndex],
  )

  const close = useCallback(() => {
    control.close()
  }, [control])

  const listHeader = useMemo(() => {
    return (
      <View
        style={[
          native(a.pt_2xl),
          { paddingBottom: 18 },
          a.relative,

          a.flex_row,
          a.align_center,
        ]}>
        <View style={[a.absolute, a.inset_0, t.atoms.bg]} />
        <Text
          style={[a.flex_1, a.text_center, a.text_lg, a.font_bold, a.pl_lg]}>
          <Trans>Choose an avatar</Trans>
        </Text>
        <Button
          hitSlop={5}
          variant="ghost"
          size="tiny"
          color="secondary"
          shape="round"
          label={_(msg`Dismiss getting started guide`)}
          onPress={close}>
          <ButtonIcon icon={Times} size="md" />
        </Button>
      </View>
    )
  }, [t.atoms.bg, _, close])

  return (
    <>
      <Dialog.InnerFlatList
        ref={listRef}
        data={dummImages}
        renderItem={renderItem}
        numColumns={3}
        columnWrapperStyle={[a.gap_md]}
        contentContainerStyle={[
          native([a.px_2xl, { minHeight: height }]),
          web(a.h_full_vh),
        ]}
        style={[web(a.h_full_vh)]}
        ListHeaderComponent={listHeader}
        stickyHeaderIndices={[0]}
        onEndReachedThreshold={4}
        keyExtractor={(item: string, index) => item + index}
        keyboardDismissMode="on-drag"
      />
      <View
        style={[
          a.absolute,
          a.bottom_0,
          a.flex_row,
          a.align_center,
          a.pt_lg,

          a.px_2xl,
          {
            borderTopWidth: 1,
            borderColor: '#D8D8D8',
            backgroundColor: 'white',
            paddingBottom: insets.bottom,
          },
        ]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={close}>
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        <Button
          disabled={selectedAvatarIndex === -1}
          testID="selectAvatar"
          label={_(msg`Select`)}
          accessibilityHint={_(msg`Select avatar`)}
          variant="solid"
          color="primary"
          size="large"
          onPress={() => {
            onSelectAvatar(dummImages[selectedAvatarIndex])
          }}>
          <ButtonText>
            <Trans>Select</Trans>
          </ButtonText>
        </Button>
      </View>
    </>
  )
}

function DialogError({ details }: { details?: string }) {
  const { _ } = useLingui()
  const control = Dialog.useDialogContext()

  return (
    <Dialog.ScrollableInner
      style={a.gap_md}
      label={_(msg`An error has occurred`)}>
      <Dialog.Close />
      <ErrorScreen
        title={_(msg`Oh no!`)}
        message={_(
          msg`There was an unexpected issue in the application. Please let us know if this happened to you!`,
        )}
        details={details}
      />
      <Button
        label={_(msg`Close dialog`)}
        onPress={() => control.close()}
        color="primary"
        size="large"
        variant="solid">
        <ButtonText>
          <Trans>Close</Trans>
        </ButtonText>
      </Button>
    </Dialog.ScrollableInner>
  )
}

export function AvatarPreview({
  uri,
  onPress,
  isSelected = false,
}: {
  uri: string
  onPress: () => void
  isSelected?: boolean
}) {
  const { gtTablet } = useBreakpoints()
  const { _ } = useLingui()
  const t = useTheme()

  return (
    <Button
      label={_(msg`Select Avatar "${uri}"`)}
      style={[a.flex_1, gtTablet ? { maxWidth: '33%' } : { maxWidth: '50%' }]}
      onPress={onPress}>
      {({ pressed }) => (
        <Image
          style={[
            a.flex_1,
            a.mb_xl,
            a.rounded_sm,
            { aspectRatio: 1, opacity: pressed ? 0.8 : 1 },
            t.atoms.bg_contrast_25,
            { borderWidth: isSelected ? 2 : 0, borderColor: 'red' },
          ]}
          source={{
            uri: uri,
          }}
          contentFit="cover"
          accessibilityLabel={uri}
          accessibilityHint=""
          cachePolicy="none"
          accessibilityIgnoresInvertColors
        />
      )}
    </Button>
  )
}
