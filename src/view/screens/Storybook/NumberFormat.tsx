import React from 'react'
import {Text, View} from 'react-native'
import {useLingui} from '@lingui/react'

import {formatCount} from '#/view/com/util/numeric/format'
import {atoms as a} from '#/alf'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowIcon} from '#/components/icons/Arrow'
import {H1} from '#/components/Typography'

export function NumberFormat() {
  const {i18n} = useLingui()

  return (
    <View style={[a.gap_md]}>
      <H1>Number format</H1>

      <Text>
        9 <ArrowIcon size="xs" /> {formatCount(i18n, 9)}
      </Text>
      <Text>
        95 <ArrowIcon size="xs" /> {formatCount(i18n, 95)}
      </Text>
      <Text>
        150 <ArrowIcon size="xs" /> {formatCount(i18n, 150)}
      </Text>
      <Text>
        950 <ArrowIcon size="xs" /> {formatCount(i18n, 950)}
      </Text>
      <Text>
        1049 <ArrowIcon size="xs" /> {formatCount(i18n, 1049)}
      </Text>
      <Text>
        1050 <ArrowIcon size="xs" /> {formatCount(i18n, 1050)}
      </Text>
      <Text>
        1060 <ArrowIcon size="xs" /> {formatCount(i18n, 1060)}
      </Text>
      <Text>
        1090 <ArrowIcon size="xs" /> {formatCount(i18n, 1090)}
      </Text>
      <Text>
        1095 <ArrowIcon size="xs" /> {formatCount(i18n, 1095)}
      </Text>
      <Text>
        1099 <ArrowIcon size="xs" /> {formatCount(i18n, 1099)}
      </Text>
      <Text>
        1100 <ArrowIcon size="xs" /> {formatCount(i18n, 1100)}
      </Text>
      <Text>
        10949 <ArrowIcon size="xs" /> {formatCount(i18n, 10949)}
      </Text>
      <Text>
        10950 <ArrowIcon size="xs" /> {formatCount(i18n, 10950)}
      </Text>
    </View>
  )
}
