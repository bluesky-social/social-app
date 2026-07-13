import {useMemo} from 'react'
import {Image, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useQuery} from '@tanstack/react-query'

import {DEFAULT_BRAND_CONFIG} from '#/lib/community/BrandContext'
import {fetchBrandList} from '#/lib/community/resolveBrand'
import {Logo} from '#/view/icons/Logo'
import {useSignupContext} from '#/screens/Signup/state'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {CheckThick_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {BackNextButtons} from '../BackNextButtons'

type CommunityOption = {
  slug: string
  displayName: string
  pds: string
  logo: string
  themeColor: string
  isDefault: boolean
}

const ICON_SIZE = 48

/**
 * First signup step: choose the community to create the account in, shown as an
 * account-switcher-style list (icon + name per row). Blacksky is the default and
 * always the first option (its config is bundled into the app, not served by the
 * brand service); other published communities follow, sourced from the brand
 * service. Selecting one points signup at that community's PDS and stamps its
 * slug so the client can resolve the brand deterministically later.
 */
export function StepCommunity({onPressBack}: {onPressBack: () => void}) {
  const t = useTheme()
  const {_} = useLingui()
  const ax = useAnalytics()
  const {state, dispatch} = useSignupContext()

  const {data: brands} = useQuery({
    queryKey: ['signup-brand-list'],
    queryFn: fetchBrandList,
    staleTime: 5 * 60 * 1000,
  })

  const options = useMemo<CommunityOption[]>(() => {
    const blacksky: CommunityOption = {
      slug: DEFAULT_BRAND_CONFIG.metadata.slug,
      displayName: DEFAULT_BRAND_CONFIG.metadata.displayName,
      pds: DEFAULT_BRAND_CONFIG.services.pds.url,
      logo: DEFAULT_BRAND_CONFIG.assets.logo,
      themeColor: DEFAULT_BRAND_CONFIG.web.themeColor,
      isDefault: true,
    }
    const others = (brands ?? [])
      .filter(b => b.slug !== blacksky.slug)
      .map(b => ({
        slug: b.slug,
        displayName: b.displayName || b.name,
        pds: b.pds,
        logo: b.logo,
        themeColor: b.themeColor,
        isDefault: false,
      }))
    return [blacksky, ...others]
  }, [brands])

  const selectedSlug =
    state.selectedBrandSlug ?? DEFAULT_BRAND_CONFIG.metadata.slug

  const onNextPress = () => {
    dispatch({type: 'next'})
    ax.metric('signup:nextPressed', {activeStep: state.activeStep})
  }

  return (
    <>
      <View style={[a.gap_md, a.pt_lg]}>
        <Text style={[a.text_md, a.leading_snug]}>
          <Trans>
            Choose the community your account will live in. You can always use
            it across the network.
          </Trans>
        </Text>
        <View style={[a.gap_xs]}>
          <TextField.LabelText>
            <Trans>Community</Trans>
          </TextField.LabelText>
          <View
            style={[
              a.rounded_lg,
              a.overflow_hidden,
              a.border,
              t.atoms.border_contrast_low,
            ]}>
            {options.map((option, i) => (
              <View key={option.slug}>
                {i > 0 && (
                  <View style={[a.border_b, t.atoms.border_contrast_low]} />
                )}
                <CommunityItem
                  option={option}
                  selected={option.slug === selectedSlug}
                  onSelect={() =>
                    dispatch({
                      type: 'setCommunity',
                      slug: option.slug,
                      serviceUrl: option.pds,
                    })
                  }
                  label={_(msg`Create your account in ${option.displayName}`)}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
      <BackNextButtons
        isLoading={state.isLoading}
        onBackPress={onPressBack}
        onNextPress={onNextPress}
      />
    </>
  )
}

function CommunityItem({
  option,
  selected,
  onSelect,
  label,
}: {
  option: CommunityOption
  selected: boolean
  onSelect: () => void
  label: string
}) {
  const t = useTheme()
  return (
    <Button label={label} onPress={onSelect} style={[a.w_full]}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.p_lg,
            a.gap_sm,
            (hovered || pressed) && t.atoms.bg_contrast_25,
          ]}>
          <View
            style={[
              {width: ICON_SIZE, height: ICON_SIZE},
              a.rounded_sm,
              a.overflow_hidden,
              a.justify_center,
              a.align_center,
              t.atoms.bg_contrast_25,
            ]}>
            {option.isDefault ? (
              <Logo width={ICON_SIZE * 0.7} />
            ) : option.logo ? (
              <Image
                accessibilityIgnoresInvertColors
                source={{uri: option.logo}}
                style={{width: ICON_SIZE, height: ICON_SIZE}}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  a.flex_1,
                  a.w_full,
                  a.justify_center,
                  a.align_center,
                  {backgroundColor: option.themeColor},
                ]}>
                <Text style={[a.text_lg, a.font_bold, {color: 'white'}]}>
                  {option.displayName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={[a.flex_1, a.gap_2xs, a.pr_2xl]}>
            <Text
              emoji
              style={[a.font_medium, a.leading_tight, a.text_md]}
              numberOfLines={1}>
              {option.displayName}
            </Text>
            <Text
              style={[a.leading_tight, t.atoms.text_contrast_medium, a.text_sm]}
              numberOfLines={1}>
              {option.pds.replace(/^https?:\/\//, '')}
            </Text>
          </View>

          {selected && (
            <View
              style={[
                {
                  width: 20,
                  height: 20,
                  backgroundColor: t.palette.positive_500,
                },
                a.rounded_full,
                a.justify_center,
                a.align_center,
              ]}>
              <CheckIcon size="xs" style={[{color: t.palette.white}]} />
            </View>
          )}
        </View>
      )}
    </Button>
  )
}
