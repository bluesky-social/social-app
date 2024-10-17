import React, {useEffect, useMemo, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import Animated, {
  FadeIn,
  FadeOutUp,
  LayoutAnimationConfig,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
} from 'react-native-reanimated'
import * as Clipboard from 'expo-clipboard'
import {ComAtprotoServerCreateAppPassword} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {isWeb} from '#/platform/detection'
import {useAppPasswordCreateMutation} from '#/state/queries/app-passwords'
import {atoms as a, native, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextInput from '#/components/forms/TextField'
import * as Toggle from '#/components/forms/Toggle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {SquareBehindSquare4_Stroke2_Corner0_Rounded as CopyIcon} from '#/components/icons/SquareBehindSquare4'
import {Text} from '#/components/Typography'

export function AddAppPasswordDialog({
  control,
  passwords,
}: {
  control: Dialog.DialogControlProps
  passwords: string[]
}) {
  const {height} = useWindowDimensions()
  return (
    <Dialog.Outer control={control} nativeOptions={{minHeight: height}}>
      <Dialog.Handle />
      <CreateDialogInner passwords={passwords} />
    </Dialog.Outer>
  )
}

function CreateDialogInner({passwords}: {passwords: string[]}) {
  const control = Dialog.useDialogContext()
  const t = useTheme()
  const {_} = useLingui()
  const autogeneratedName = useRandomName()
  const [name, setName] = useState('')
  const [privileged, setPrivileged] = useState(false)
  const {
    mutateAsync: actuallyCreateAppPassword,
    error: apiError,
    data,
  } = useAppPasswordCreateMutation()

  const regexFailError = useMemo(
    () =>
      new DisplayableError(
        _(
          msg`App password names can only contain letters, numbers, spaces, dashes, and underscores`,
        ),
      ),
    [_],
  )

  const {
    mutate: createAppPassword,
    error: validationError,
    isPending,
  } = useMutation<
    ComAtprotoServerCreateAppPassword.AppPassword,
    Error | DisplayableError
  >({
    mutationFn: async () => {
      const chosenName = name.trim() || autogeneratedName
      if (chosenName.length < 4) {
        throw new DisplayableError(
          _(msg`App password names must be at least 4 characters long`),
        )
      }
      if (passwords.find(p => p === chosenName)) {
        throw new DisplayableError(_(msg`App password name must be unique`))
      }
      return await actuallyCreateAppPassword({name: chosenName, privileged})
    },
  })

  const [hasBeenCopied, setHasBeenCopied] = useState(false)
  useEffect(() => {
    if (hasBeenCopied) {
      const timeout = setTimeout(() => setHasBeenCopied(false), 100)
      return () => clearTimeout(timeout)
    }
  }, [hasBeenCopied])

  const error =
    validationError || (!name.match(/^[a-zA-Z0-9-_ ]*$/) && regexFailError)

  return (
    <Dialog.ScrollableInner label={_(msg`Add app password`)}>
      <View style={[native(a.pt_md)]}>
        <LayoutAnimationConfig skipEntering skipExiting>
          {!data ? (
            <Animated.View
              style={[a.gap_lg]}
              exiting={native(SlideOutLeft)}
              key={0}>
              <Text style={[a.text_2xl, a.font_bold]}>
                <Trans>Add App Password</Trans>
              </Text>
              <Text style={[a.text_md, a.leading_snug]}>
                <Trans>
                  Please enter a unique name for this app password or use our
                  randomly generated one.
                </Trans>
              </Text>
              <View>
                <TextInput.Root isInvalid={!!error}>
                  <Dialog.Input
                    label={_(msg`App Password`)}
                    placeholder={autogeneratedName}
                    onChangeText={setName}
                    returnKeyType="done"
                    onSubmitEditing={() => createAppPassword()}
                    blurOnSubmit
                    autoCorrect={false}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoFocus
                  />
                </TextInput.Root>
              </View>
              {error instanceof DisplayableError && (
                <TextInput.SuffixText label={error.message}>
                  {error.message}
                </TextInput.SuffixText>
              )}
              <Toggle.Item
                name="privileged"
                type="checkbox"
                label={_(msg`Allow access to your direct messages`)}
                value={privileged}
                onChange={setPrivileged}
                style={[a.flex_1]}>
                <Toggle.Checkbox />
                <Toggle.LabelText
                  style={[a.font_normal, a.text_md, a.leading_snug]}>
                  <Trans>Allow access to your direct messages</Trans>
                </Toggle.LabelText>
              </Toggle.Item>
              <Button
                label={_(msg`Next`)}
                size="large"
                variant="solid"
                color="primary"
                style={[a.flex_1]}
                onPress={() => createAppPassword()}
                disabled={isPending}>
                <ButtonText>
                  <Trans>Next</Trans>
                </ButtonText>
                <ButtonIcon icon={ChevronRight} />
              </Button>
              {!!apiError ||
                (error && !(error instanceof DisplayableError) && (
                  <Admonition type="error">
                    <Trans>
                      Failed to create app password. Please try again.
                    </Trans>
                  </Admonition>
                ))}
            </Animated.View>
          ) : (
            <Animated.View
              style={[a.gap_lg]}
              entering={isWeb ? FadeIn.delay(200) : SlideInRight}
              key={1}>
              <Text style={[a.text_2xl, a.font_bold]}>
                <Trans>Here is your app password!</Trans>
              </Text>
              <Text style={[a.text_md, a.leading_snug]}>
                <Trans>
                  Use this to sign into the other app along with your handle.
                </Trans>
              </Text>
              <View style={[a.relative]}>
                {hasBeenCopied && (
                  <Animated.View
                    entering={ZoomIn.duration(100)}
                    exiting={FadeOutUp.duration(2000)}
                    style={[
                      a.absolute,
                      {bottom: '110%', right: 0},
                      a.justify_center,
                      a.gap_sm,
                      a.z_10,
                    ]}
                    pointerEvents="none">
                    <Text
                      style={[
                        a.font_bold,
                        a.text_right,
                        a.text_md,
                        t.atoms.text_contrast_high,
                      ]}>
                      <Trans>Copied!</Trans>
                    </Text>
                  </Animated.View>
                )}
                <Button
                  label={_(msg`Copy App Password`)}
                  size="large"
                  variant="solid"
                  color="secondary"
                  style={[a.flex_1, a.justify_between]}
                  onPress={() => {
                    Clipboard.setStringAsync(data.password)
                    setHasBeenCopied(true)
                  }}>
                  <ButtonText>{data.password}</ButtonText>
                  <ButtonIcon icon={CopyIcon} />
                </Button>
              </View>
              <Text
                style={[
                  a.text_md,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  For security reasons, you won't be able to view this again. If
                  you lose this app password, you'll need to generate a new one.
                </Trans>
              </Text>
              <Button
                label={_(msg`Done`)}
                size="large"
                variant="outline"
                color="primary"
                style={[a.flex_1]}
                onPress={() => control.close()}>
                <ButtonText>
                  <Trans>Done</Trans>
                </ButtonText>
              </Button>
            </Animated.View>
          )}
        </LayoutAnimationConfig>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

class DisplayableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DisplayableError'
  }
}

function useRandomName() {
  return useState(
    () => shadesOfBlue[Math.floor(Math.random() * shadesOfBlue.length)],
  )[0]
}

const shadesOfBlue: string[] = [
  'AliceBlue',
  'Aqua',
  'Aquamarine',
  'Azure',
  'BabyBlue',
  'Blue',
  'BlueViolet',
  'CadetBlue',
  'CornflowerBlue',
  'Cyan',
  'DarkBlue',
  'DarkCyan',
  'DarkSlateBlue',
  'DeepSkyBlue',
  'DodgerBlue',
  'ElectricBlue',
  'LightBlue',
  'LightCyan',
  'LightSkyBlue',
  'LightSteelBlue',
  'MediumAquaMarine',
  'MediumBlue',
  'MediumSlateBlue',
  'MidnightBlue',
  'Navy',
  'PowderBlue',
  'RoyalBlue',
  'SkyBlue',
  'SlateBlue',
  'SteelBlue',
  'Teal',
  'Turquoise',
]
