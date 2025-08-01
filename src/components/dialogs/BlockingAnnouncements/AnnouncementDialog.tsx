import {createContext, useMemo, useContext, useState, ReactNode} from 'react'
import {View, ScrollView, useWindowDimensions} from 'react-native'
// import {FocusScope} from 'radix-ui/internal'
// import {RemoveScrollBar} from 'react-remove-scroll-bar'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {LinearGradient} from 'expo-linear-gradient'

import {isNative} from '#/platform/detection'
import {atoms as a, useTheme, useBreakpoints, web, flatten} from '#/alf'
import {transparentifyColor} from '#/alf/util/colorGeneration'
import {useA11y} from '#/state/a11y'

const GUTTER = 24

export const Context = createContext({
  close: () => {},
})

export function useAnnouncementDialogContext() {
  return useContext(Context)
}

export function AnnouncementDialogOuter({children}: {children: ReactNode}) {
  const [open, setOpen] = useState(true)

  const ctx = useMemo(
    () => ({
      close() {
        setOpen(false)
      },
    }),
    [setOpen],
  )

  return <Context.Provider value={ctx}>{open && children}</Context.Provider>
}

export function AnnouncementDialog({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  const t = useTheme()
  const {gtPhone} = useBreakpoints()
  const {reduceMotionEnabled} = useA11y()
  const {height} = useWindowDimensions()
  const insets = useSafeAreaInsets()

  return (
    <>
      <View style={[a.fixed, a.inset_0, !reduceMotionEnabled && a.fade_in]}>
        <LinearGradient
          colors={[
            transparentifyColor(t.atoms.bg.backgroundColor, 0),
            t.atoms.bg.backgroundColor,
            t.atoms.bg.backgroundColor,
          ]}
          start={[0.5, 0]}
          end={[0.5, 1]}
          style={[a.absolute, a.inset_0]}
        />
      </View>

      {/* <RemoveScrollBar /> */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[a.fixed, a.inset_0, a.z_10]}
        contentContainerStyle={[
          a.align_center,
          gtPhone &&
            web({
              paddingHorizontal: GUTTER,
              paddingVertical: '10vh',
            }),
        ]}>
        {/**
         * This is needed to prevent centered dialogs from overflowing
         * above the screen, and provides a "natural" centering so that
         * stacked dialogs appear relatively aligned.
         */}
        <View
          style={[
            a.w_full,
            a.z_20,
            a.align_center,
            !gtPhone && a.justify_end,
            {minHeight: height},
            isNative && [
              {
                paddingBottom: Math.max(insets.bottom, a.p_2xl.padding),
              },
            ],
          ]}>
          {/* <FocusScope.FocusScope loop asChild trapped> */}

          {!gtPhone && (
            <View
              style={[
                a.flex_1,
                a.w_full,
                {
                  minHeight: Math.max(insets.top, a.p_2xl.padding),
                },
              ]}>
              <LinearGradient
                colors={[
                  transparentifyColor(t.atoms.bg.backgroundColor, 0),
                  t.atoms.bg.backgroundColor,
                ]}
                start={[0.5, 0]}
                end={[0.5, 1]}
                style={[a.absolute, a.inset_0]}
              />
            </View>
          )}

          <View
            role="dialog"
            aria-role="dialog"
            aria-label={label}
            style={flatten([
              a.relative,
              a.w_full,
              a.p_2xl,
              t.atoms.bg,
              !reduceMotionEnabled && a.zoom_fade_in,
              gtPhone && [
                a.rounded_md,
                a.border,
                t.atoms.shadow_lg,
                t.atoms.border_contrast_low,
                web({
                  maxWidth: 420,
                }),
              ],
            ])}>
            {children}
          </View>
          {/* </FocusScope.FocusScope> */}
        </View>
      </ScrollView>
    </>
  )
}
