import React from 'react'
import {View} from 'react-native'

import {atoms as a, native, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {Button, ButtonText} from '#/components/Button'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {Divider} from '#/components/Divider'
import {Link} from '#/components/Link'
import {makeSearchLink} from '#/lib/routes/links'

export function useTagMenuControl() {
  return Dialog.useDialogControl()
}

export function TagMenu({
  children,
  control,
  tag,
  authorHandle,
}: React.PropsWithChildren<{
  control: Dialog.DialogOuterProps['control']
  tag: string
  authorHandle?: string
}>) {
  const t = useTheme()

  return (
    <>
      {children}

      <Dialog.Outer control={control}>
        <Dialog.Handle />

        <Dialog.Inner label="Tag">
          <View
            style={[
              a.rounded_md,
              a.border,
              a.mb_md,
              t.atoms.border_contrast_low,
              t.atoms.bg_contrast_25,
            ]}>
            <Link
              label="tag"
              to={makeSearchLink({query: tag})}
              onPress={control.close}>
              <View
                style={[
                  a.w_full,
                  a.flex_row,
                  a.align_center,
                  a.justify_start,
                  a.gap_md,
                  a.px_lg,
                  a.py_md,
                ]}>
                <Search size="lg" style={[t.atoms.text_contrast_medium]} />
                <Text
                  numberOfLines={1}
                  style={[
                    a.flex_1,
                    a.text_md,
                    a.font_bold,
                    native({top: 2}),
                    t.atoms.text_contrast_medium,
                  ]}>
                  See{' '}
                  <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                    {tag}
                  </Text>{' '}
                  posts
                </Text>
              </View>
            </Link>

            {authorHandle && (
              <>
                <Divider />

                <Link
                  label="tag"
                  to={makeSearchLink({query: tag, from: authorHandle})}
                  onPress={control.close}>
                  <View
                    style={[
                      a.w_full,
                      a.flex_row,
                      a.align_center,
                      a.justify_start,
                      a.gap_md,
                      a.px_lg,
                      a.py_md,
                    ]}>
                    <Person size="lg" style={[t.atoms.text_contrast_medium]} />
                    <Text
                      numberOfLines={1}
                      style={[
                        a.flex_1,
                        a.text_md,
                        a.font_bold,
                        native({top: 2}),
                        t.atoms.text_contrast_medium,
                      ]}>
                      See{' '}
                      <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                        {tag}
                      </Text>{' '}
                      posts by this user
                    </Text>
                  </View>
                </Link>
              </>
            )}

            <Divider />

            <Button label="tag">
              <View
                style={[
                  a.w_full,
                  a.flex_row,
                  a.align_center,
                  a.justify_start,
                  a.gap_md,
                  a.px_lg,
                  a.py_md,
                ]}>
                <Mute size="lg" style={[t.atoms.text_contrast_medium]} />
                <Text
                  numberOfLines={1}
                  style={[
                    a.flex_1,
                    a.text_md,
                    a.font_bold,
                    native({top: 2}),
                    t.atoms.text_contrast_medium,
                  ]}>
                  Mute{' '}
                  <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                    {tag}
                  </Text>{' '}
                  posts
                </Text>
              </View>
            </Button>
          </View>

          <Button
            label="tag"
            size="small"
            variant="ghost"
            color="secondary"
            onPress={control.close}>
            <ButtonText>Cancel</ButtonText>
          </Button>
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
