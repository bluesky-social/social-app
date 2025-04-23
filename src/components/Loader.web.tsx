import {View} from 'react-native'

import {atoms as a, flatten, useTheme} from '#/alf'
import {Props, useCommonSVGProps} from '#/components/icons/common'
import {Loader_Stroke2_Corner0_Rounded as Icon} from '#/components/icons/Loader'

export function Loader(props: Props) {
  const t = useTheme()
  const common = useCommonSVGProps(props)

  return (
    <View
      style={[
        a.relative,
        a.justify_center,
        a.align_center,
        {width: common.size, height: common.size},
      ]}>
      {/* css rotation animation - /bskyweb/templates/base.html */}
      <div className="rotate-500ms">
        <Icon
          {...props}
          style={[
            a.absolute,
            a.inset_0,
            t.atoms.text_contrast_high,
            flatten(props.style),
          ]}
        />
      </div>
    </View>
  )
}
