import {useRef, useState} from 'react'
import {View} from 'react-native'
import PagerView from 'react-native-pager-view'
import {Image} from 'expo-image'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, tokens, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {PROP_1, PROP_2, PROP_3} from './images'
import {Dot, useValuePropText} from './ValuePropositionPager.shared'

export function ValuePropositionPager({
  step,
  setStep,
  avatarUri,
}: {
  step: 0 | 1 | 2
  setStep: (step: 0 | 1 | 2) => void
  avatarUri?: string
}) {
  const t = useTheme()
  const [activePage, setActivePage] = useState(step)
  const ref = useRef<PagerView>(null)

  if (step !== activePage) {
    setActivePage(step)
    ref.current?.setPage(step)
  }

  const images = [PROP_1[t.name], PROP_2[t.name], PROP_3[t.name]]

  return (
    <View style={[a.h_full, {marginHorizontal: tokens.space.xl * -1}]}>
      <PagerView
        ref={ref}
        style={[a.flex_1]}
        initialPage={step}
        onPageSelected={evt => {
          const page = evt.nativeEvent.position as 0 | 1 | 2
          if (step !== page) {
            setActivePage(page)
            setStep(page)
          }
        }}>
        {([0, 1, 2] as const).map(page => (
          <Page
            key={page}
            page={page}
            image={images[page]}
            avatarUri={avatarUri}
          />
        ))}
      </PagerView>
    </View>
  )
}

function Page({
  page,
  image,
  avatarUri,
}: {
  page: 0 | 1 | 2
  image: string
  avatarUri?: string
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {title, description, alt} = useValuePropText(page)

  return (
    <View key={page}>
      <View
        style={[
          a.relative,
          a.align_center,
          a.justify_center,
          a.pointer_events_none,
        ]}>
        <Image
          source={image}
          style={[a.w_full, a.aspect_square]}
          alt={alt}
          accessibilityIgnoresInvertColors={false} // I guess we do need it to blend into the background
        />
        {page === 1 && (
          <Image
            source={avatarUri}
            style={[
              a.z_10,
              a.absolute,
              a.rounded_full,
              {
                width: `${(80 / 393) * 100}%`,
                height: `${(80 / 393) * 100}%`,
              },
            ]}
            accessibilityIgnoresInvertColors
            alt={_(msg`Your profile picture`)}
          />
        )}
      </View>

      <View style={[a.mt_4xl, a.gap_2xl, a.px_xl, a.align_center]}>
        <View style={[a.flex_row, a.gap_sm]}>
          <Dot active={page === 0} />
          <Dot active={page === 1} />
          <Dot active={page === 2} />
        </View>

        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_3xl, a.text_center]}>{title}</Text>
          <Text
            style={[
              t.atoms.text_contrast_medium,
              a.text_md,
              a.leading_snug,
              a.text_center,
            ]}>
            {description}
          </Text>
        </View>
      </View>
    </View>
  )
}
