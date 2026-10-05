import {Image} from 'expo-image'

import {atoms as a} from '#/alf'

export function GermLogo({size}: {size: 'small' | 'large'}) {
  return (
    <Image
      source={require('../../assets/icons/community/germ_logo.webp')}
      accessibilityIgnoresInvertColors={false}
      contentFit="cover"
      useAppleWebpCodec
      style={[
        a.rounded_full,
        size === 'large' ? {width: 32, height: 32} : {width: 16, height: 16},
      ]}
    />
  )
}
